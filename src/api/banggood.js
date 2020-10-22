const Queue = require('bull');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const url = require('url');
const db = require('../db/database');
const Source = require('../domain/source');
const BangQueue = require('../domain/bangqueue');
const s3 = require('../services/s3');
const tools = require('../services/tools');
require('dotenv').config();

var BanggoodBucket = process.env.BANGGOOD_BUCKET_NAME;

const bangStockWorkQueue = new Queue('bangStockWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

const bangFullWorkQueue = new Queue('bangFullWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

const makeBanggoodStockProductURL = (product_id, variant_id, warehouse) => {
    return variant_id != 'NULL' ? `https://www.banggood.com/-p-${product_id}.html?ID=${variant_id.split('-').join(',')}&warehouse=${warehouse}` :
        `https://www.banggood.com/-p-${product_id}.html?warehouse=${warehouse}`;
};

const warehouseToCountryMapping = (warehouse) => {
    let mapping = {
        'USA': 223,
        'BR': 30,
        'DE': 81,
        'ES': 195,
        'FR': 73,
        'IT': 105,
        'UK': 222,
        'NL': 150,
        'IN': 99,
        'AR': 10,
        'RU': 176,
        'PT': 171,
        'TR': 215,
        'AU': 13,
        'PL': 170,
        'HK': 96,
        'CZ': 56
    };

    return mapping[warehouse];
};

const makeBanggoodStockProductsList = (payload, queryObject) => {
    var products = [];

    payload.map((item1) => {
        if (item1.variant_ids) {
            let variant_ids = tools.getUnique(item1.variant_ids);

            variant_ids.map((item2) => {
                let warehouses = tools.getUnique(item1.warehouse);

                warehouses.map((item3) => {
                    var product = {};
                    let country_id = warehouseToCountryMapping(item3);

                    product.product_id = item1.product_id;
                    product.variant_id = item2;
                    product.warehouse = item3;
                    product.country_id = country_id;
                    product.saveToDB = queryObject.db === '1' ? true : false;

                    products.push(product);
                });
            });
        } else {
            let warehouses = tools.getUnique(item1.warehouse);

            warehouses.map((item3) => {
                var product = {};

                let country_id = warehouseToCountryMapping(item3);
                product.product_id = item1.product_id;
                product.variant_id = "NULL";
                product.warehouse = item3;
                product.country_id = country_id;
                product.saveToDB = queryObject.db === '1' ? true : false;

                products.push(product);
            });
        }
    });

    return products;
};

const banggoodStockProducts = async (req, res) => {
    try {
        let token = req.headers.authorization.split(' ')[1];
        const queryObject = url.parse(req.url, true).query;
        let products = makeBanggoodStockProductsList(req.body.products, queryObject);
        const rows = [];

        let jobsCount = await bangStockWorkQueue.count()
        if (jobsCount > process.env.BANGGOOD_STOCK_MAX_JOBS) {
            return res.status(429).json({
                message: 'Reduce rate, there are courrently ' + jobsCount + ' in queue'
            })
        }


        products.map(product => {
            rows.push({
                uuid: uuidv4(),
                user_token: token,
                product_id: product.product_id,
                variant_id: product.variant_id,
                warehouse: product.warehouse,
                product_url: makeBanggoodStockProductURL(product.product_id, product.variant_id, product.warehouse),
                product_info_payload: null,
                s3: null,
                status: "READY",
                created_at: moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                updated_at: moment(Date.now()).format("YYYY-MM-DD hh:mm:ss")
            });
        });

        db.query(BangQueue.insertUpdateBangStockQueueSQL(rows), [], (err, data) => {
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

                        await bangStockWorkQueue.add(data, options);
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

const banggoodStockHistory = async (req, res) => {
    try {
        var sql = `SELECT product_id, variant_id, warehouse, status, reserved_at, finished_at, failed_at, s3 FROM banggood_stock_queue `;
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
                    var remove_fields = [
                        'zoneSite', 'warehouse_list', 'isWishlist', 'qaText', 'couponBanner', 'californiaTips', 'isBgAccount',
                        'activityLabel', 'sloganData', 'dsLimitBrand', 'msg_update', 'vehicleTotal', 'vehicleShow', 'isDlInterestFree',
                        'isEIInterestFree', 'isBankTransferValidCountry', 'is_gst_incl', 'hasLogin', 'add_to_ebay', 'attrRange', 'is_wholesale_edm',
                        'preRateShow', 'alertMeShow', 'vipProductShow', 'multiDiscountShow', 'halfDiscountShow', 'timeDiscountShow', 'fdProductShow',
                        'edmProductShow', 'appOnlyShow', 'overReduceProductShow', 'overReduceProduct', 'newUserProductShow', 'giftProductShow',
                        'freeShipmentProductShow', 'coupons', 'shippingAcDsProductShow', 'showDiscountTips', 'cashbackShow', 'explosive_plan',
                        'isHideBatch', 'gst', 'isProtecting', 'fdProduct'
                    ];

                    let datas = [];
                    let results = [];

                    datas = data.map((data) => (JSON.parse(JSON.stringify(data))));

                    let total_length = datas.length;
                    let temp_length = 0;

                    datas.map((data, key) => {
                        let request = s3.createGetPublicJsonRequest(BanggoodBucket, data.s3 ? data.s3.split('amazonaws.com/')[1] : 'XXX');

                        delete data.s3;
                        results.push(data);

                        s3.downloadFromS3(request)
                            .then((data) => {
                                results[key].product_info_payload = JSON.parse(data.Body);
                                remove_fields.map((field) => (delete results[key].product_info_payload[field]));
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

const banggoodStockSingleProduct = async (req, res) => {
    try {
        var sql = `SELECT product_id, variant_id, warehouse, status, reserved_at, finished_at, failed_at, s3 FROM banggood_stock_queue `;
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
                    var remove_fields = [
                        'zoneSite', 'warehouse_list', 'isWishlist', 'qaText', 'couponBanner', 'californiaTips', 'isBgAccount',
                        'activityLabel', 'sloganData', 'dsLimitBrand', 'msg_update', 'vehicleTotal', 'vehicleShow', 'isDlInterestFree',
                        'isEIInterestFree', 'isBankTransferValidCountry', 'is_gst_incl', 'hasLogin', 'add_to_ebay', 'attrRange', 'is_wholesale_edm',
                        'preRateShow', 'alertMeShow', 'vipProductShow', 'multiDiscountShow', 'halfDiscountShow', 'timeDiscountShow', 'fdProductShow',
                        'edmProductShow', 'appOnlyShow', 'overReduceProductShow', 'overReduceProduct', 'newUserProductShow', 'giftProductShow',
                        'freeShipmentProductShow', 'coupons', 'shippingAcDsProductShow', 'showDiscountTips', 'cashbackShow', 'explosive_plan',
                        'isHideBatch', 'gst', 'isProtecting', 'fdProduct'
                    ];

                    if (queryObject.warehouse) {
                        datas = data.filter((data) => (queryObject.warehouse === JSON.parse(JSON.stringify(data)).warehouse));
                        if (datas.length === 0 || !JSON.parse(JSON.stringify(datas[0])).s3) {
                            return res.status(400).json({
                                results: "Ehy! That warehouse is not available for that product!"
                            });
                        } else {
                            datas = JSON.parse(JSON.stringify(datas[0]));

                            let request = s3.createGetPublicJsonRequest(BanggoodBucket, datas.s3.split('amazonaws.com/')[1]);

                            delete datas.s3;
                            results.push(datas);

                            s3.downloadFromS3(request)
                                .then((data) => {
                                    results[0].product_info_payload = JSON.parse(data.Body);
                                })
                                .catch((err) => {
                                    results[0].product_info_payload = null;
                                })
                                .finally(() => {
                                    results.map((data) => {
                                        remove_fields.map((field) => (data.product_info_payload ? delete data.product_info_payload[field] : null));
                                    })

                                    return res.status(200).json({
                                        results: results
                                    });
                                });
                        }
                    } else {
                        datas = data.map((data) => (JSON.parse(JSON.stringify(data))));

                        let total_length = datas.length;
                        let temp_length = 0;

                        datas.map((data, key) => {
                            let request = s3.createGetPublicJsonRequest(BanggoodBucket, data.s3 ? data.s3.split('amazonaws.com/')[1] : 'XXX');

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
                                        results.map((data) => {
                                            remove_fields.map((field) => (data.product_info_payload ? delete data.product_info_payload[field] : null));
                                        })

                                        return res.status(200).json({
                                            results: results
                                        });
                                    }
                                });
                        });
                    }
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

const banggoodFullProducts = async (req, res) => {
    try {
        let validLanguageList = [];
        let invalidLanguageList = [];
        let token = req.headers.authorization.split(' ')[1];

        let jobsCount = await bangFullWorkQueue.count()
        if (jobsCount > process.env.BANGGOOD_FULL_MAX_JOBS) {
            return res.status(429).json({
                message: 'Reduce rate, there are courrently ' + jobsCount + ' in queue'
            })
        }

        let fields = 'store_language, store_url, store_country, country_name, banggood_contry_id';
        let condition = `store_name LIKE '%Banggood%'`;
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
                                product.product_id = item1;
                                product.language = item2;
                                product.product_url = `${JSON.parse(JSON.stringify(data)).filter((lg) => (
                                    lg.store_language === item2
                                ))[0].store_url}-p-${item1}.html?cur_warehouse=${item2}`;
                                product.saveToDB = queryObject.db === '1' ? true : false;
                                product.country_code = JSON.parse(JSON.stringify(data)).filter((lg) => (
                                    lg.store_language === item2
                                ))[0].store_country;
                                product.country_name = JSON.parse(JSON.stringify(data)).filter((lg) => (
                                    lg.store_language === item2
                                ))[0].country_name;
                                product.country_id = JSON.parse(JSON.stringify(data)).filter((lg) => (
                                    lg.store_language === item2
                                ))[0].banggood_contry_id;

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

                db.query(BangQueue.insertUpdateBangFullQueueSQL(rows), [], (err, data) => {
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

                                await bangFullWorkQueue.add(data, options);
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

const banggoodFullHistory = async (req, res) => {
    try {
        var sql = `SELECT status, reserved_at, finished_at, failed_at, product_id, language, s3 FROM banggood_full_queue `;
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
                        let request = s3.createGetPublicJsonRequest(BanggoodBucket, data.s3 ? data.s3.split('amazonaws.com/')[1] : 'XXX');

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

const banggoodFullSingleProduct = async (req, res) => {
    try {
        var sql = `SELECT product_id, language, status, reserved_at, finished_at, failed_at, s3 FROM banggood_full_queue `;
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
                        let request = s3.createGetPublicJsonRequest(BanggoodBucket, data.s3 ? data.s3.split('amazonaws.com/')[1] : 'XXX');

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
bangStockWorkQueue.on('global:completed', (jobId, result) => {
    console.log(`Job ${jobId} completed`);
});

bangStockWorkQueue.on(`global:failed`, (jobId, err) => {
    console.log(`Job ${jobId} failed with error`);
});

bangFullWorkQueue.on('global:completed', (jobId, result) => {
    console.log(`Job ${jobId} completed`);
});

bangFullWorkQueue.on(`global:failed`, (jobId, err) => {
    console.log(`Job ${jobId} failed with error`);
});

module.exports = {
    banggoodStockProducts,
    banggoodStockHistory,
    banggoodStockSingleProduct,
    banggoodFullProducts,
    banggoodFullHistory,
    banggoodFullSingleProduct
};
