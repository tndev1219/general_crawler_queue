const Queue = require('bull');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const url = require('url');
const db = require('../db/database');
const Source = require('../domain/source');
const GearbestQueue = require('../domain/gearbestqueue');
const s3 = require('../services/s3');
const tools = require('../services/tools');
require('dotenv').config();

var GearbestBucket = process.env.GEARBEST_BUCKET_NAME;

const gearbestFullWorkQueue = new Queue('gearbestFullWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

const gearbestStockWorkQueue = new Queue('gearbestStockWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

const makeGearbestStockProductURL = (product) => {
    return `https://www.gearbest.com/goods/goods-multi?callback=goodsgoodsmultigoodsn${product.goodsSn}shopcode${product.shopCode}warehousecode${product.warehouseCode}isvirtual0categoryId${product.categoryId}&good_sn=${product.goodsSn}&shop_code=${product.shopCode}&warehouse_code=${product.warehouseCode}&is_virtual=0&categoryId=${product.categoryId}`;
};

const makeGearbestStockProductsList = (payload, queryObject) => {
    var products = [];

    payload.map((item1) => {
        var product = {};
        product.goodsSn = item1.goodsSn;
        product.product_url = makeGearbestStockProductURL(item1);
        product.saveToDB = queryObject.db === '1' ? true : false;

        products.push(product);
    });

    return products;
};

const gearbestFullProducts = async (req, res) => {
    try {
        let validLanguageList = [];
        let invalidLanguageList = [];
        let token = req.headers.authorization.split(' ')[1];

        let jobsCount = await gearbestFullWorkQueue.count()
        if (jobsCount > process.env.GEARBEST_FULL_MAX_JOBS) {
            return res.status(429).json({
                message: 'Reduce rate, there are courrently ' + jobsCount + ' in queue'
            })
        }


        let fields = 'store_language, store_url';
        let condition = `store_name LIKE '%Gearbest%'`;
        db.query(Source.getSourceSQL(fields, condition), [], (err, data) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            } else {
                let products = [];
                const rows = [];
                const queryObject = url.parse(req.url, true).query;

                validLanguageList = JSON.parse(JSON.stringify(data)).map((lg) => (lg.store_language));

                if (req.body.items && req.body.languages) {
                    let items = tools.getUnique(req.body.items);
                    let languages = tools.getUnique(req.body.languages);

                    items.map((item1) => {
                        languages.map((item2) => {
                            var product = {};

                            if (validLanguageList.includes(item2)) {
                                product.goodsSn = item1.split('ID:') ? item1.split('ID:')[1] : null;
                                product.language = item2;
                                product.product_url = `${JSON.parse(JSON.stringify(data)).filter(data => data.store_language === item2)[0].store_url}${item1.split('gearbest.com/')[1]}`;
                                product.saveToDB = queryObject.db === '1' ? true : false;

                                products.push(product);
                            } else {
                                invalidLanguageList.push(item2);
                            }
                        });
                    });
                } else {
                    return res.status(400).json({
                        message: 'Invalid Payload!'
                    });
                }

                products.map(product => {
                    rows.push({
                        uuid: uuidv4(),
                        user_token: token,
                        goodsSn: product.goodsSn,
                        language: product.language,
                        product_url: product.product_url,
                        product_info_payload: null,
                        s3: null,
                        status: 'READY',
                        created_at: moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                        updated_at: moment(Date.now()).format("YYYY-MM-DD hh:mm:ss")
                    });
                });

                db.query(GearbestQueue.insertUpdateGearbestFullQueueSQL(rows), [], (err, data) => {
                    if (err) {
                        return res.status(500).json({
                            message: err.message
                        });
                    } else {
                        products.map(async (product, key) => {
                            try {
                                const data = {
                                    product
                                };
                                const options = {
                                    token: token,
                                    attempts: process.env.MAX_RETRY_ATTEMPTS,
                                    delay: 1000,
                                    backoff: 30000,
                                    timeout: 60000,
                                    priority: req.body.priority && req.body.priority === 'high' ? 1 : req.body.priority && req.body.priority === 'low' ? 2 : 3,
                                    removeOnFail: true,
                                    removeOnComplete: true
                                };

                                await gearbestFullWorkQueue.add(data, options);
                            } catch (e) {
                                console.log(e);
                            }
                        });

                        const tempList = invalidLanguageList;
                        invalidLanguageList = [];

                        if (tempList.length === 0) {
                            return res.status(200).json({
                                message: "ok"
                            });
                        } else {
                            return res.status(400).json({
                                message: `Your requeset has some issues. ${tempList} is not registered. So you can't get any result about these languages.`
                            });
                        }
                    }
                });
            }
        });
    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};

const gearbestFullHistory = async (req, res) => {
    try {
        var sql = `SELECT status, reserved_at, finished_at, failed_at, goodsSn, language, s3 FROM gearbest_full_queue `;
        var params = [];
        var condition = 'ORDER BY updated_at ASC LIMIT ?';

        if (req.body.status) {
            params.push(req.body.status);
            sql = sql + 'WHERE status = ? ';
        }

        if (req.body.last_ts) {
            params.push(req.body.last_ts);

            if (sql.includes('WHERE')) {
                sql = sql + 'AND updated_at > ? ';
            } else {
                sql = sql + 'WHERE updated_at > ? ';
            }
        }

        if (req.body.limit) {
            params.push(req.body.limit);
        } else {
            params.push(100);
        }

        sql = sql + condition;

        db.query(sql, params, (err, data) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            } else {
                if (data && data.length > 0) {
                    let datas = [];
                    let results = [];

                    datas = data.map((data) => (JSON.parse(JSON.stringify(data))));

                    let total_length = datas.length;
                    let temp_length = 0;

                    datas.map((data, key) => {
                        let request = s3.createGetPublicJsonRequest(GearbestBucket, data.s3 ? data.s3.split('amazonaws.com/')[1] : 'XXX');

                        delete data.s3;
                        results.push(data);

                        s3.downloadFromS3(request)
                            .then((data) => {
                                results[key].product_info_payload = JSON.parse(data.Body);
                            })
                            .catch((err) => {
                                results[key].product_info_payload = null;
                            })
                            .finally(() => {
                                temp_length++;

                                if (temp_length === total_length) {
                                    return res.status(200).json({
                                        results: results
                                    });
                                }
                            });
                    });
                } else {
                    return res.status(400).json({
                        results: "Product Not Found"
                    });
                }
            }
        });
    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};

const gearbestFullSingleProduct = async (req, res) => {
    try {
        var sql = `SELECT status, goodsSn, language, reserved_at, finished_at, failed_at, s3 FROM gearbest_full_queue `;
        const queryObject = url.parse(req.url, true).query;
        var params = [];

        params.push(req.params.productId);
        sql = sql + 'WHERE goodsSn = ? ';

        if (queryObject.last_ts) {
            params.push(queryObject.last_ts);
            sql = sql + 'AND updated_at > ? ';
        }

        db.query(sql, params, (err, data) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            } else {
                if (data && data.length > 0) {
                    let datas = [];
                    let results = [];

                    datas = data.map((data) => (JSON.parse(JSON.stringify(data))));

                    let total_length = datas.length;
                    let temp_length = 0;

                    datas.map((data, key) => {
                        let request = s3.createGetPublicJsonRequest(GearbestBucket, data.s3 ? data.s3.split('amazonaws.com/')[1] : 'XXX');

                        delete data.s3;
                        results.push(data);

                        s3.downloadFromS3(request)
                            .then((data) => {
                                results[key].product_info_payload = JSON.parse(data.Body);
                            })
                            .catch((err) => {
                                results[key].product_info_payload = null;
                            })
                            .finally(() => {
                                temp_length++;

                                if (temp_length === total_length) {
                                    return res.status(200).json({
                                        results: results
                                    });
                                }
                            });
                    });
                } else {
                    return res.status(400).json({
                        results: "Product Not Found"
                    });
                }
            }
        });

    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};

const gearbestStockProducts = async (req, res) => {
    try {
        let token = req.headers.authorization.split(' ')[1];

        let jobsCount = await gearbestStockWorkQueue.count()
        if (jobsCount > process.env.GEARBEST_STOCK_MAX_JOBS) {
            return res.status(429).json({
                message: 'Reduce rate, there are courrently ' + jobsCount + ' in queue'
            })
        }

        if (!req.body.products || req.body.products.length === 0) {
            return res.status(400).json({
                message: 'Invalid Payload!'
            });
        }

        let params = tools.getUnique(req.body.products);
        let fields = 'goodsSn, shopCode, warehouseCode, categoryId';
        let condition = `goodsSn IN (${params.join()})`;

        db.query(GearbestQueue.getGearbestFullQueueSQL(fields, condition), [], (err, data) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            } else {
                let products = [];
                const rows = [];
                const queryObject = url.parse(req.url, true).query;

                var datas = data.map(data => (JSON.parse(JSON.stringify(data))));

                datas.map(data => {
                    if (!products.some(product => (product.goodsSn === data.goodsSn))) {
                        products.push(data);
                    }

                    if (params.includes(data.goodsSn)) {
                        params.shift(data.goodsSn)
                    }
                });

                if (products.length === 0) {
                    return res.status(200).json({
                        message: `Please run full product crawler first for these product: ${params.join(', ')}`
                    });
                }

                products = makeGearbestStockProductsList(products, queryObject);

                products.map(product => {
                    rows.push({
                        uuid: uuidv4(),
                        user_token: token,
                        goodsSn: product.goodsSn,
                        product_url: product.product_url,
                        product_info_payload: null,
                        s3: null,
                        status: 'READY',
                        created_at: moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                        updated_at: moment(Date.now()).format("YYYY-MM-DD hh:mm:ss")
                    });
                });

                db.query(GearbestQueue.insertUpdateGearbestStockQueueSQL(rows), [], (err, data) => {
                    if (err) {
                        return res.status(500).json({
                            message: err.message
                        });
                    } else {
                        products.map(async (product, key) => {
                            try {
                                const data = {
                                    product
                                };
                                const options = {
                                    token: token,
                                    attempts: process.env.MAX_RETRY_ATTEMPTS,
                                    delay: 1000,
                                    backoff: 30000,
                                    timeout: 60000,
                                    removeOnFail: true,
                                    removeOnComplete: true,
                                    priority: req.body.priority && req.body.priority === 'high' ? 1 : req.body.priority && req.body.priority === 'low' ? 2 : 3
                                };

                                await gearbestStockWorkQueue.add(data, options);
                            } catch (e) {
                                console.log(e);
                            }
                        });

                        if (params.length === 0) {
                            return res.status(200).json({
                                message: "ok"
                            });
                        } else {
                            return res.status(200).json({
                                message: `Please run full product crawler first for these product: ${params.join(', ')}`
                            });
                        }
                    }
                });
            }
        });
    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};

const gearbestStockHistory = async (req, res) => {
    try {
        var sql = `SELECT goodsSn, status, reserved_at, finished_at, failed_at, s3 FROM gearbest_stock_queue `;
        var params = [];
        var condition = 'ORDER BY updated_at ASC LIMIT ?';

        if (req.body.status) {
            params.push(req.body.status);
            sql = sql + 'WHERE status = ? ';
        }

        if (req.body.last_ts) {
            params.push(req.body.last_ts);

            if (sql.includes('WHERE')) {
                sql = sql + 'AND updated_at > ? ';
            } else {
                sql = sql + 'WHERE updated_at > ? ';
            }
        }

        if (req.body.limit) {
            params.push(req.body.limit);
        } else {
            params.push(100);
        }

        sql = sql + condition;

        db.query(sql, params, (err, data) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            } else {
                if (data && data.length > 0) {
                    let datas = [];
                    let results = [];

                    datas = data.map((data) => (JSON.parse(JSON.stringify(data))));

                    let total_length = datas.length;
                    let temp_length = 0;

                    datas.map((data, key) => {
                        let request = s3.createGetPublicJsonRequest(GearbestBucket, data.s3 ? data.s3.split('amazonaws.com/')[1] : 'XXX');

                        delete data.s3;
                        results.push(data);

                        s3.downloadFromS3(request)
                            .then((data) => {
                                results[key].product_info_payload = JSON.parse(data.Body);
                            })
                            .catch((err) => {
                                results[key].product_info_payload = null;
                            })
                            .finally(() => {
                                temp_length++;

                                if (temp_length === total_length) {
                                    return res.status(200).json({
                                        results: results
                                    });
                                }
                            });
                    });
                } else {
                    return res.status(400).json({
                        results: "Product Not Found"
                    });
                }
            }
        });
    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};

const gearbestStockSingleProduct = async (req, res) => {
    try {
        var sql = `SELECT status, goodsSn, reserved_at, finished_at, failed_at, s3 FROM gearbest_stock_queue `;
        const queryObject = url.parse(req.url, true).query;
        var params = [];

        params.push(req.params.productId);
        sql = sql + 'WHERE goodsSn = ? ';

        if (queryObject.last_ts) {
            params.push(queryObject.last_ts);
            sql = sql + 'AND updated_at > ? ';
        }

        db.query(sql, params, (err, data) => {
            if (err) {
                return res.status(500).json({
                    message: err.message
                });
            } else {
                if (data && data.length > 0) {
                    let datas = [];
                    let results = [];

                    datas = data.map((data) => (JSON.parse(JSON.stringify(data))));

                    let total_length = datas.length;
                    let temp_length = 0;

                    datas.map((data, key) => {
                        let request = s3.createGetPublicJsonRequest(GearbestBucket, data.s3 ? data.s3.split('amazonaws.com/')[1] : 'XXX');

                        delete data.s3;
                        results.push(data);

                        s3.downloadFromS3(request)
                            .then((data) => {
                                results[key].product_info_payload = JSON.parse(data.Body);
                            })
                            .catch((err) => {
                                results[key].product_info_payload = null;
                            })
                            .finally(() => {
                                temp_length++;

                                if (temp_length === total_length) {
                                    return res.status(200).json({
                                        results: results
                                    });
                                }
                            });
                    });
                } else {
                    return res.status(400).json({
                        results: "Product Not Found"
                    });
                }
            }
        });
    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};

// Bull Queue Global Event Listener
gearbestFullWorkQueue.on('global:completed', (jobId, result) => {
    console.log(`Job ${jobId} completed`);
});

gearbestFullWorkQueue.on(`global:failed`, (jobId, err) => {
    console.log(`Job ${jobId} failed with error`);
});

gearbestStockWorkQueue.on('global:completed', (jobId, result) => {
    console.log(`Job ${jobId} completed`);
});

gearbestStockWorkQueue.on(`global:failed`, (jobId, err) => {
    console.log(`Job ${jobId} failed with error`);
});

module.exports = {
    gearbestFullProducts,
    gearbestFullHistory,
    gearbestFullSingleProduct,
    gearbestStockProducts,
    gearbestStockHistory,
    gearbestStockSingleProduct
};
