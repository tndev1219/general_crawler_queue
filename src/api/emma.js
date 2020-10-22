const Queue = require('bull');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const url = require('url');
const db = require('../db/database');
const EmmaQueue = require('../domain/emmaqueue');
const s3 = require('../services/s3');
const tools = require('../services/tools');
require('dotenv').config();

var EmmaBucket = process.env.EMMA_BUCKET_NAME;

const emmaFullWorkQueue = new Queue('emmaFullWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

const emmaFullProducts = async (req, res) => {
    try {
        let token = req.headers.authorization.split(' ')[1];

        let jobsCount = await emmaFullWorkQueue.count()
        if (jobsCount > process.env.EMMA_FULL_MAX_JOBS) {
            return res.status(429).json({
                message: 'Reduce rate, there are courrently ' + jobsCount + ' in queue'
            })
        }

        let products = [];
        const rows = [];
        const queryObject = url.parse(req.url, true).query;

        if (req.body.items) {
            let items = tools.getUnique(req.body.items);

            items.map((item) => {
                var product = {};

                product.product_id = item.split('-p-') ? item.split('-p-')[1].split('-')[0] : null;
                product.product_url = item;
                product.saveToDB = queryObject.db === '1' ? true : false;

                products.push(product);
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
                product_url: product.product_url,
                product_info_payload: null,
                s3: null,
                status: 'READY',
                created_at: moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                updated_at: moment(Date.now()).format("YYYY-MM-DD hh:mm:ss")
            });
        });

        db.query(EmmaQueue.insertUpdateEmmaFullQueueSQL(rows), [], (err, data) => {
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

                        await emmaFullWorkQueue.add(data, options);
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

const emmaFullHistory = async (req, res) => {
    try {
        var sql = `SELECT status, reserved_at, finished_at, failed_at, product_id, s3 FROM emma_full_queue `;
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
                        let request = s3.createGetPublicJsonRequest(EmmaBucket, data.s3 ? data.s3.split('amazonaws.com/')[1] : 'XXX');

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

const emmaFullSingleProduct = async (req, res) => {
    try {
        var sql = `SELECT status, product_id, reserved_at, finished_at, failed_at, s3 FROM emma_full_queue `;
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
                        let request = s3.createGetPublicJsonRequest(EmmaBucket, data.s3 ? data.s3.split('amazonaws.com/')[1] : 'XXX');

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
emmaFullWorkQueue.on('global:completed', (jobId, result) => {
    console.log(`Job ${jobId} completed`);
});

emmaFullWorkQueue.on(`global:failed`, (jobId, err) => {
    console.log(`Job ${jobId} failed with error`);
});

module.exports = {
    emmaFullProducts,
    emmaFullHistory,
    emmaFullSingleProduct
};
