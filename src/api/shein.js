const Queue = require('bull');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const url = require('url');
const db = require('../db/database');
const Source = require('../domain/source');
const SheinQueue = require('../domain/sheinqueue');
const s3 = require('../services/s3');
const tools = require('../services/tools');
require('dotenv').config();

var SheinBucket = process.env.SHEIN_BUCKET_NAME;

const sheinStockWorkQueue = new Queue('sheinStockWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

const sheinFullWorkQueue = new Queue('sheinFullWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

const makeSheinStockProductURL = (product_id) => {
    return `https://us.shein.com/product/checkStockByIds?t=${product_id}`;
};

const makeSheinStockProductsList = (payload, queryObject) => {
    var products = [];

    payload.map((item) => {
        var product = {};

        product.product_id = item;
        product.product_url = makeSheinStockProductURL(item);
        product.saveToDB = queryObject.db === '1' ? true : false;

        products.push(product);
    });

    return products;
};

const sheinStockProducts = async (req, res) => {
    try {
        let token = req.headers.authorization.split(' ')[1];
        const queryObject = url.parse(req.url, true).query;
        let products = makeSheinStockProductsList(req.body.product_ids, queryObject);
        const rows = [];

        let jobsCount = await sheinStockWorkQueue.count()
        if (jobsCount > process.env.SHEIN_STOCK_MAX_JOBS) {
            return res.status(429).json({
                message: 'Reduce rate, there are courrently ' + jobsCount + ' in queue'
            })
        }


        products.map(product => {
            rows.push({
                uuid: uuidv4(),
                user_token: token,
                product_id: product.product_id,
                product_url: product.product_url,
                product_info_payload: null,
                s3: null,
                status: "READY",
                created_at: moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                updated_at: moment(Date.now()).format("YYYY-MM-DD hh:mm:ss")
            });
        });

        db.query(SheinQueue.insertUpdateSheinStockQueueSQL(rows), [], (err, data) => {
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

                        await sheinStockWorkQueue.add(data, options);
                    } catch (e) {
                        console.log(e);
                    }
                });

                return res.status(200).json({
                    message: "ok"
                });
            }
        });
    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};

const sheinStockHistory = async (req, res) => {
    try {
        var sql = `SELECT product_id, status, reserved_at, finished_at, failed_at, s3 FROM shein_stock_queue `;
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
                        let request = s3.createGetPublicJsonRequest(SheinBucket, data.s3 ? data.s3.split('amazonaws.com/')[1] : 'XXX');

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

const sheinStockSingleProduct = async (req, res) => {
    try {
        var sql = `SELECT product_id, status, reserved_at, finished_at, failed_at, s3 FROM shein_stock_queue `;
        const queryObject = url.parse(req.url, true).query;
        var params = [];

        params.push(req.params.productId);
        sql = sql + 'WHERE product_id = ? ';

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
                        let request = s3.createGetPublicJsonRequest(SheinBucket, data.s3 ? data.s3.split('amazonaws.com/')[1] : 'XXX');

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
                        results: "EHY! That product is not there"
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

const sheinFullProducts = async (req, res) => {
    try {
        let validLanguageList = [];
        let invalidLanguageList = [];
        let token = req.headers.authorization.split(' ')[1];

        let jobsCount = await sheinFullWorkQueue.count()
        if (jobsCount > process.env.SHEIN_FULL_MAX_JOBS) {
            return res.status(429).json({
                message: 'Reduce rate, there are courrently ' + jobsCount + ' in queue'
            })
        }

        let fields = 'store_language, store_url, store_country, country_name';
        let condition = `store_name LIKE '%Shein%'`;
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

                if (req.body.products) {
                    products = [];
                    req.body.products.map(product => {
                        if (validLanguageList.includes(product.language)) {
                            product.product_url = `${JSON.parse(JSON.stringify(data)).filter((lg) => (
                                lg.store_language === product.language
                            ))[0].store_url}-p-${product.product_id}.html?cur_warehouse=${product.language}`;
                            product.saveToDB = queryObject.db === '1' ? true : false;
                            product.country_code = JSON.parse(JSON.stringify(data)).filter((lg) => (
                                lg.store_language === product.language
                            ))[0].store_country;
                            product.country_name = JSON.parse(JSON.stringify(data)).filter((lg) => (
                                lg.store_language === product.language
                            ))[0].country_name;
                            product.country_id = JSON.parse(JSON.stringify(data)).filter((lg) => (
                                lg.store_language === product.language
                            ))[0].banggood_contry_id;

                            products.push(product);
                        } else {
                            invalidLanguageList.push(product.language);
                        }
                    });
                } else if (req.body.items && req.body.languages) {
                    let items = tools.getUnique(req.body.items);
                    let languages = tools.getUnique(req.body.languages);

                    items.map((item1) => {
                        languages.map((item2) => {
                            var product = {};

                            if (validLanguageList.includes(item2)) {
                                product.product_id = item1.split('-p-')[1].split('-cat')[0];
                                product.language = item2;
                                product.product_url = `${JSON.parse(JSON.stringify(data)).filter((lg) => (
                                    lg.store_language === item2
                                ))[0].store_url}${item1.split('shein.com/')}`;
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
                        product_id: product.product_id,
                        language: product.language,
                        product_url: product.product_url,
                        product_info_payload: null,
                        s3: null,
                        status: 'READY',
                        created_at: moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                        updated_at: moment(Date.now()).format("YYYY-MM-DD hh:mm:ss")
                    });
                });

                db.query(SheinQueue.insertUpdateSheinFullQueueSQL(rows), [], (err, data) => {
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

                                await sheinFullWorkQueue.add(data, options);
                            } catch (e) {
                                console.log(e);
                            }
                        });

                        if (invalidLanguageList.length === 0) {
                            return res.status(200).json({
                                message: "ok"
                            });
                        } else {
                            return res.status(400).json({
                                message: `Your requeset has some issues. ${invalidLanguageList} is not registered. So you can't get any result about these languages.`
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

const sheinFullHistory = async (req, res) => {
    try {
        var sql = `SELECT status, reserved_at, finished_at, failed_at, product_id, language, s3 FROM shein_full_queue `;
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
                        let request = s3.createGetPublicJsonRequest(SheinBucket, data.s3 ? data.s3.split('amazonaws.com/')[1] : 'XXX');

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

const sheinFullSingleProduct = async (req, res) => {
    try {
        var sql = `SELECT product_id, language, status, reserved_at, finished_at, failed_at, s3 FROM shein_full_queue `;
        const queryObject = url.parse(req.url, true).query;
        var params = [];

        params.push(req.params.productId);
        sql = sql + 'WHERE product_id = ? ';

        if (queryObject.warehouse) {
            params.push(queryObject.warehouse);
            sql = sql + 'AND language = ? ';
        }

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
                        let request = s3.createGetPublicJsonRequest(SheinBucket, data.s3 ? data.s3.split('amazonaws.com/')[1] : 'XXX');

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
sheinStockWorkQueue.on('global:completed', (jobId, result) => {
    console.log(`Job ${jobId} completed`);
});

sheinStockWorkQueue.on(`global:failed`, (jobId, err) => {
    console.log(`Job ${jobId} failed with error`);
});

sheinFullWorkQueue.on('global:completed', (jobId, result) => {
    console.log(`Job ${jobId} completed`);
});

sheinFullWorkQueue.on(`global:failed`, (jobId, err) => {
    console.log(`Job ${jobId} failed with error`);
});

module.exports = {
    sheinStockProducts,
    sheinStockHistory,
    sheinStockSingleProduct,
    sheinFullProducts,
    sheinFullHistory,
    sheinFullSingleProduct
};
