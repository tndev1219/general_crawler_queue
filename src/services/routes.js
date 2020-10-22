// routes.js
const extractors = require('./extractors');
var moment = require('moment');
var db = require('../db/database');
var AliQueue = require('../domain/aliqueue');
var BangQueue = require('../domain/bangqueue');
var GearbestQueue = require('../domain/gearbestqueue');
var EmmaQueue = require('../domain/emmaqueue');
var SheinQueue = require('../domain/sheinqueue');
var Store = require('../domain/store');
var s3 = require('./s3');
require('dotenv').config();

var AliexpressBucket = process.env.ALIEXPRESS_BUCKET_NAME;
var BanggoodBucket = process.env.BANGGOOD_BUCKET_NAME;
var GearbestBucket = process.env.GEARBEST_BUCKET_NAME;
var EmmaBucket = process.env.EMMA_BUCKET_NAME;
var SheinBucket = process.env.SHEIN_BUCKET_NAME;

// Aliexpress page crawler
exports.ALIEXPRESSFULL = async ({
    dataScript,
    userInput,
    request
}) => {
    let {
        productId,
        language,
        token,
        saveToDB
    } = request.userData;
    let {
        includeDescription
    } = userInput;
    let product = false;

    try {
        // Fetch product details    
        product = await extractors.getAliFullProductDetail(dataScript, request.url);
    } catch (e) {
        // console.log('----------routes.js: 39-------------', e.message);
    } finally {
        if (!product) {
            await new Promise((resolve, reject) => {
                let params = [
                    'FAILED',
                    moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                    moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                    token,
                    productId.toString(),
                    language
                ];
                let fields = 'status = ?, failed_at = ?, updated_at = ?';
                let condition = 'user_token = ? AND product_code = ? AND language=?';

                db.query(AliQueue.updateAliFullQueueSQL(fields, condition), params, (err, data) => {
                    if (err) {
                        // console.log('-------------routes.js: 56--------------', err.message);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            await new Promise((resolve, reject) => {
                let store = new Store();
                db.query(Store.getStoreByFieldNameSQL('store_id'), [product.base_info.store.id], (err, data) => {
                    if (err) {
                        // console.log('----------routes.js: 68-------------', err.message);
                        reject(err);
                    } else {
                        if (data && data.length > 0) {
                            let params = [
                                product.base_info.store.name,
                                product.base_info.store.url,
                                product.base_info.store.positiveRate ? parseFloat(product.base_info.store.positiveRate) : null,
                                moment(product.base_info.store.establishedAt, 'MMM D, YYYY').format('YYYY-MM-DD'),
                                moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                                product.base_info.store.id
                            ];
                            let fields = 'store_name = ?, store_url = ?, store_feedbacks = ?, seller_since = ?, modified_at = ?';
                            let condition = 'store_id = ?';
                            db.query(Store.updateStoreByFieldNameSQL(fields, condition), params, (err, data) => {
                                if (err) {
                                    // console.log('----------routes.js: 84-------------', err.message);
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        } else {
                            let params = {
                                store_id: product.base_info.store.id,
                                store_name: product.base_info.store.name,
                                store_url: product.base_info.store.url,
                                store_feedbacks: product.base_info.store.positiveRate ? parseFloat(product.base_info.store.positiveRate) : null,
                                seller_since: moment(product.base_info.store.establishedAt, 'MMM D, YYYY').format('YYYY-MM-DD'),
                                created_at: moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                                modified_at: moment(Date.now()).format("YYYY-MM-DD hh:mm:ss")
                            };
                            db.query(store.getAddStoreSQL(), params, (err, data) => {
                                if (err) {
                                    // console.log('----------routes.js: 102-------------', err.message);
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        }
                    }
                });

                let filename = `${productId}-${language}-full.json`;
                let request = s3.createPutPublicJsonRequest(AliexpressBucket, filename, JSON.stringify(product));

                s3.uploadToS3(request)
                    .then((data) => {
                        let params = [
                            'FINISHED',
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            saveToDB ? JSON.stringify(product) : null,
                            `https://${AliexpressBucket}.s3.us-east-1.amazonaws.com/${filename}`,
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            token,
                            productId.toString(),
                            language
                        ];
                        let fields = 'status = ?, finished_at = ?, product_info_payload = ?, s3 = ?, updated_at = ?';
                        let condition = 'user_token = ? AND product_code = ? AND language=?';

                        db.query(AliQueue.updateAliFullQueueSQL(fields, condition), params, (err, data) => {
                            if (err) {
                                // console.log('-------------routes.js: 125-------------', err.message);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    })
                    .catch((err) => {
                        let params = [
                            'FAILED',
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            token,
                            productId.toString(),
                            language
                        ];
                        let fields = 'status = ?, failed_at = ?, updated_at = ?';
                        let condition = 'user_token = ? AND product_code = ? AND language=?';

                        db.query(AliQueue.updateAliFullQueueSQL(fields, condition), params, (err, data) => {
                            if (err) {
                                // console.log('-------------routes.js: 56--------------', err.message);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
            });
            console.log(`CRAWLER -- Fetching product: ${productId} completed and successfully pushed to dataset`);
        }
    }
};

exports.ALIEXPRESSSTOCK = async ({
    dataScript,
    userInput,
    request
}) => {
    let {
        productId,
        language,
        token,
        saveToDB
    } = request.userData;
    let {
        includeDescription
    } = userInput;
    let product = false;

    try {
        // Fetch product details    
        product = await extractors.getAliStockProductDetail(dataScript, request.url);
    } catch (e) {
        // console.log('----------routes.js: 39-------------', e.message);
    } finally {
        if (!product) {
            await new Promise((resolve, reject) => {
                let params = [
                    'FAILED',
                    moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                    moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                    token,
                    productId.toString(),
                    language
                ];
                let fields = 'status = ?, failed_at = ?, updated_at = ?';
                let condition = 'user_token = ? AND product_code = ? AND language=?';

                db.query(AliQueue.updateAliStockQueueSQL(fields, condition), params, (err, data) => {
                    if (err) {
                        // console.log('-------------routes.js: 56--------------', err.message);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            await new Promise((resolve, reject) => {
                let filename = `${productId}-${language}-stock.json`;
                let request = s3.createPutPublicJsonRequest(AliexpressBucket, filename, JSON.stringify(product));

                s3.uploadToS3(request)
                    .then((data) => {
                        let params = [
                            'FINISHED',
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            saveToDB ? JSON.stringify(product) : null,
                            `https://${AliexpressBucket}.s3.us-east-1.amazonaws.com/${filename}`,
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            token,
                            productId.toString(),
                            language
                        ];
                        let fields = 'status = ?, finished_at = ?, product_info_payload = ?, s3 = ?, updated_at = ?';
                        let condition = 'user_token = ? AND product_code = ? AND language=?';

                        db.query(AliQueue.updateAliStockQueueSQL(fields, condition), params, (err, data) => {
                            if (err) {
                                // console.log('-------------routes.js: 125-------------', err.message);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    })
                    .catch((err) => {
                        let params = [
                            'FAILED',
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            token,
                            productId.toString(),
                            language
                        ];
                        let fields = 'status = ?, failed_at = ?, updated_at = ?';
                        let condition = 'user_token = ? AND product_code = ? AND language=?';

                        db.query(AliQueue.updateAliStockQueueSQL(fields, condition), params, (err, data) => {
                            if (err) {
                                // console.log('-------------routes.js: 56--------------', err.message);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
            });
            console.log(`CRAWLER -- Fetching product: ${productId} completed and successfully pushed to dataset`);
        }
    }
};

exports.ALIDESCRIPTION = async ({
    $,
    request
}) => {
    try {
        const {
            product
        } = request.userData;

        // Fetch product details
        const description = await extractors.getProductDescription($);
        product.description = description;
        delete product.descriptionURL;

        // Push data
        // await Apify.pushData({ ...product });

        console.log(`CRAWLER -- Fetching product description: ${product.id} completed and successfully pushed to dataset`);
    } catch (e) {
        console.log(e);
    }
};

// Banggood page crawler
exports.BANGGOODSTOCK = async ({
    dataScript,
    userInput,
    request
}) => {
    let {
        token,
        product_id,
        variant_id,
        warehouse,
        saveToDB
    } = request.userData;

    if (!dataScript) {
        await new Promise((resolve, reject) => {
            let params = [
                'FAILED',
                moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                token,
                product_id.toString(),
                variant_id.toString(),
                warehouse
            ];
            let fields = 'status = ?, failed_at = ?, updated_at = ?';
            let condition = 'user_token = ? AND product_id = ? AND variant_id=? AND warehouse=?';

            db.query(BangQueue.updateBangStockQueue(fields, condition), params, (err, data) => {
                if (err) {
                    // console.log('-------------routes.js: 193--------------', err.message);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    } else {
        await new Promise((resolve, reject) => {
            if (warehouse == JSON.parse(dataScript).warehouse) {
                let filename = `${product_id}-${variant_id}-${warehouse}-stock.json`;
                let request = s3.createPutPublicJsonRequest(BanggoodBucket, filename, dataScript);

                s3.uploadToS3(request)
                    .then((data) => {
                        let params = [
                            'FINISHED',
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            saveToDB ? dataScript : null,
                            `https://${BanggoodBucket}.s3.us-east-1.amazonaws.com/${filename}`,
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            token,
                            product_id.toString(),
                            variant_id.toString(),
                            warehouse
                        ];
                        let fields = 'status = ?, finished_at = ?, product_info_payload = ?, s3 = ?, updated_at = ?';
                        let condition = 'user_token = ? AND product_id = ? AND variant_id=? AND warehouse=?';

                        db.query(BangQueue.updateBangStockQueue(fields, condition), params, (err, data) => {
                            if (err) {
                                // console.log('-------------routes.js: 216-------------', err.message);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    })
                    .catch((err) => {
                        let params = [
                            'FAILED',
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            token,
                            product_id.toString(),
                            variant_id.toString(),
                            warehouse
                        ];
                        let fields = 'status = ?, failed_at = ?, updated_at = ?';
                        let condition = 'user_token = ? AND product_id = ? AND variant_id=? AND warehouse=?';

                        db.query(BangQueue.updateBangStockQueue(fields, condition), params, (err, data) => {
                            if (err) {
                                // console.log('-------------routes.js: 193--------------', err.message);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
            } else {
                let params = [
                    'FINISHED',
                    moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                    null,
                    null,
                    moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                    token,
                    product_id.toString(),
                    variant_id.toString(),
                    warehouse
                ];
                let fields = 'status = ?, finished_at = ?, product_info_payload = ?, s3 = ?, updated_at = ?';
                let condition = 'user_token = ? AND product_id = ? AND variant_id=? AND warehouse=?';

                db.query(BangQueue.updateBangStockQueue(fields, condition), params, (err, data) => {
                    if (err) {
                        // console.log('-------------routes.js: 216-------------', err.message);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
        console.log(`CRAWLER -- Fetching product: ${product_id} completed and successfully pushed to dataset`);
    }
};

exports.BANGGOODFULL = async ({
    dataScript,
    userInput,
    request
}) => {
    let {
        token,
        product_id,
        language,
        saveToDB
    } = request.userData;
    let product = false;

    try {
        product = extractors.getBangFullProductDetail(dataScript);
    } catch (e) {
        console.log('----------routes.js: 232-------------', e.message);
    } finally {
        if (!product) {
            await new Promise((resolve, reject) => {
                let params = [
                    'FINISHED',
                    moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                    moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                    null,
                    null,
                    token,
                    product_id.toString(),
                    language
                ];
                let fields = 'status = ?, finished_at = ?, updated_at = ?, product_info_payload = ?, s3 = ?';
                let condition = 'user_token = ? AND product_id = ? AND language=?';

                db.query(BangQueue.updateBangFullQueue(fields, condition), params, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            await new Promise((resolve, reject) => {

                let filename = `${product_id}-${language}-full.json`;
                let request = s3.createPutPublicJsonRequest(BanggoodBucket, filename, JSON.stringify(product));

                s3.uploadToS3(request)
                    .then((data) => {
                        let params = [
                            'FINISHED',
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            saveToDB ? JSON.stringify(product) : null,
                            `https://${BanggoodBucket}.s3.us-east-1.amazonaws.com/${filename}`,
                            token,
                            product_id.toString(),
                            language
                        ];
                        let fields = 'status = ?, finished_at = ?, updated_at = ?, product_info_payload = ?, s3 = ?';
                        let condition = 'user_token = ? AND product_id = ? AND language=?';

                        db.query(BangQueue.updateBangFullQueue(fields, condition), params, (err, data) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    })
                    .catch((err) => {
                        let params = [
                            'FAILED',
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            token,
                            product_id.toString(),
                            language
                        ];
                        let fields = 'status = ?, failed_at = ?, updated_at = ?';
                        let condition = 'user_token = ? AND product_id = ? AND language=?';

                        db.query(BangQueue.updateBangFullQueue(fields, condition), params, (err, data) => {
                            if (err) {
                                // console.log('-------------routes.js: 193--------------', err.message);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
            });
            console.log(`CRAWLER -- Fetching product: ${product_id} completed and successfully pushed to dataset`);
        }
    }
};

// Gearbest page crawler
exports.GEARBESTFULL = async ({
    dataScript,
    userInput,
    request
}) => {
    let {
        token,
        goodsSn,
        language,
        saveToDB
    } = request.userData;
    let product = false;

    try {
        product = extractors.getGearbestFullProductDetail(dataScript);
    } catch (e) {
        console.log('----------routes.js: 232-------------', e.message);
    } finally {
        if (!product) {
            await new Promise((resolve, reject) => {
                let params = [
                    'FAILED',
                    moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                    moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                    token,
                    goodsSn,
                    language
                ];
                let fields = 'status = ?, failed_at = ?, updated_at = ?';
                let condition = 'user_token = ? AND goodsSn = ? AND language=?';

                db.query(GearbestQueue.updateGearbestFullQueueSQL(fields, condition), params, (err, data) => {
                    if (err) {
                        // console.log('-------------routes.js: 193--------------', err.message);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            await new Promise((resolve, reject) => {

                let filename = `${goodsSn}-${language}-full.json`;
                let request = s3.createPutPublicJsonRequest(GearbestBucket, filename, JSON.stringify(product));

                s3.uploadToS3(request)
                    .then((data) => {
                        let params = [
                            'FINISHED',
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            saveToDB ? JSON.stringify(product) : null,
                            `https://${GearbestBucket}.s3.us-east-1.amazonaws.com/${filename}`,
                            product.additional_info.shopCode ? product.additional_info.shopCode : null,
                            product.additional_info.warehouseCode ? product.additional_info.warehouseCode : null,
                            product.additional_info.categoryId ? product.additional_info.categoryId : null,
                            token,
                            goodsSn,
                            language
                        ];
                        let fields = 'status = ?, finished_at = ?, updated_at = ?, product_info_payload = ?, s3 = ?, shopCode=?, warehouseCode=?, categoryId=?';
                        let condition = 'user_token = ? AND goodsSn = ? AND language=?';

                        db.query(GearbestQueue.updateGearbestFullQueueSQL(fields, condition), params, (err, data) => {
                            if (err) {
                                // console.log('-------------routes.js: 272-------------', err.message);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    })
                    .catch((err) => {
                        let params = [
                            'FAILED',
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            token,
                            goodsSn,
                            language
                        ];
                        let fields = 'status = ?, failed_at = ?, updated_at = ?';
                        let condition = 'user_token = ? AND goodsSn = ? AND language=?';

                        db.query(GearbestQueue.updateGearbestFullQueueSQL(fields, condition), params, (err, data) => {
                            if (err) {
                                // console.log('-------------routes.js: 193--------------', err.message);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
            });
            console.log(`CRAWLER -- Fetching product: ${goodsSn} completed and successfully pushed to dataset`);
        }
    }
};

exports.GEARBESTSTOCK = async ({
    dataScript,
    userInput,
    request
}) => {
    let {
        token,
        goodsSn,
        saveToDB
    } = request.userData;

    if (!dataScript) {
        await new Promise((resolve, reject) => {
            let params = [
                'FAILED',
                moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                token,
                goodsSn
            ];
            let fields = 'status = ?, failed_at = ?, updated_at = ?';
            let condition = 'user_token = ? AND goodsSn = ?';

            db.query(GearbestQueue.updateGearbestStockQueueSQL(fields, condition), params, (err, data) => {
                if (err) {
                    // console.log('-------------routes.js: 193--------------', err.message);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    } else {
        await new Promise((resolve, reject) => {
            let filename = `${goodsSn}-stock.json`;
            let request = s3.createPutPublicJsonRequest(GearbestBucket, filename, dataScript);

            s3.uploadToS3(request)
                .then((data) => {
                    let params = [
                        'FINISHED',
                        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                        saveToDB ? dataScript : null,
                        `https://${GearbestBucket}.s3.us-east-1.amazonaws.com/${filename}`,
                        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                        token,
                        goodsSn
                    ];
                    let fields = 'status = ?, finished_at = ?, product_info_payload = ?, s3 = ?, updated_at = ?';
                    let condition = 'user_token = ? AND goodsSn = ?';

                    db.query(GearbestQueue.updateGearbestStockQueueSQL(fields, condition), params, (err, data) => {
                        if (err) {
                            // console.log('-------------routes.js: 216-------------', err.message);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                })
                .catch((err) => {
                    let params = [
                        'FAILED',
                        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                        token,
                        goodsSn
                    ];
                    let fields = 'status = ?, failed_at = ?, updated_at = ?';
                    let condition = 'user_token = ? AND goodsSn = ?';

                    db.query(GearbestQueue.updateGearbestStockQueueSQL(fields, condition), params, (err, data) => {
                        if (err) {
                            // console.log('-------------routes.js: 193--------------', err.message);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
        });
        console.log(`CRAWLER -- Fetching product: ${goodsSn} completed and successfully pushed to dataset`);
    }
};

exports.EMMAFULL = async ({
    dataScript,
    userInput,
    request
}) => {
    let {
        token,
        product_url,
        saveToDB
    } = request.userData;
    let product = false;

    try {
        product = extractors.getEmmaFullProductDetail(dataScript);
    } catch (e) {
        console.log('----------routes.js: 232-------------', e.message);
    } finally {
        if (!product) {
            await new Promise((resolve, reject) => {
                let params = [
                    'FINISHED',
                    moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                    moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                    null,
                    null,
                    token,
                    product_url
                ];
                let fields = 'status = ?, finished_at = ?, updated_at = ?, product_info_payload = ?, s3 = ?';
                let condition = 'user_token = ? AND product_url = ?';

                db.query(EmmaQueue.updateEmmaFullQueueSQL(fields, condition), params, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            await new Promise((resolve, reject) => {

                let filename = `${product_url.split('-p-')[1].split('.htm')[0]}-full.json`;
                let request = s3.createPutPublicJsonRequest(EmmaBucket, filename, JSON.stringify(product));

                s3.uploadToS3(request)
                    .then((data) => {
                        let params = [
                            'FINISHED',
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            saveToDB ? JSON.stringify(product) : null,
                            `https://${EmmaBucket}.s3.us-east-1.amazonaws.com/${filename}`,
                            token,
                            product_url
                        ];
                        let fields = 'status = ?, finished_at = ?, updated_at = ?, product_info_payload = ?, s3 = ?';
                        let condition = 'user_token = ? AND product_url = ?';

                        db.query(EmmaQueue.updateEmmaFullQueueSQL(fields, condition), params, (err, data) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    })
                    .catch((err) => {
                        let params = [
                            'FAILED',
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            token,
                            product_url
                        ];
                        let fields = 'status = ?, failed_at = ?, updated_at = ?';
                        let condition = 'user_token = ? AND product_url = ?';

                        db.query(EmmaQueue.updateEmmaFullQueueSQL(fields, condition), params, (err, data) => {
                            if (err) {
                                // console.log('-------------routes.js: 193--------------', err.message);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
            });
            console.log(`CRAWLER -- Fetching product: ${product_url} completed and successfully pushed to dataset`);
        }
    }
};

exports.SHEINSTOCK = async ({
    dataScript,
    userInput,
    request
}) => {
    let {
        token,
        product_id,
        saveToDB
    } = request.userData;

    if (!dataScript) {
        await new Promise((resolve, reject) => {
            let params = [
                'FAILED',
                moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                token,
                product_id
            ];
            let fields = 'status = ?, failed_at = ?, updated_at = ?';
            let condition = 'user_token = ? AND product_id = ?';

            db.query(SheinQueue.updateSheinStockQueue(fields, condition), params, (err, data) => {
                if (err) {
                    // console.log('-------------routes.js: 193--------------', err.message);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    } else {
        await new Promise((resolve, reject) => {
            let filename = `${product_id}-stock.json`;
            let request = s3.createPutPublicJsonRequest(SheinBucket, filename, dataScript);

            s3.uploadToS3(request)
                .then((data) => {
                    let params = [
                        'FINISHED',
                        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                        saveToDB ? dataScript : null,
                        `https://${SheinBucket}.s3.us-east-1.amazonaws.com/${filename}`,
                        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                        token,
                        product_id
                    ];
                    let fields = 'status = ?, finished_at = ?, product_info_payload = ?, s3 = ?, updated_at = ?';
                    let condition = 'user_token = ? AND product_id = ?';

                    db.query(SheinQueue.updateSheinStockQueue(fields, condition), params, (err, data) => {
                        if (err) {
                            // console.log('-------------routes.js: 216-------------', err.message);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                })
                .catch((err) => {
                    let params = [
                        'FAILED',
                        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                        token,
                        product_id
                    ];
                    let fields = 'status = ?, failed_at = ?, updated_at = ?';
                    let condition = 'user_token = ? AND product_id = ?';

                    db.query(SheinQueue.updateSheinStockQueue(fields, condition), params, (err, data) => {
                        if (err) {
                            // console.log('-------------routes.js: 193--------------', err.message);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
        });
        console.log(`CRAWLER -- Fetching product: ${product_id} completed and successfully pushed to dataset`);
    }
};

exports.SHEINFULL = async ({
    dataScript,
    userInput,
    request
}) => {
    let {
        token,
        product_id,
        language,
        saveToDB
    } = request.userData;
    let product = false;

    try {
        product = extractors.getSheinFullProductDetail(dataScript);
    } catch (e) {
        console.log('----------routes.js: 232-------------', e.message);
    } finally {
        if (!product) {
            await new Promise((resolve, reject) => {
                let params = [
                    'FINISHED',
                    moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                    moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                    null,
                    null,
                    token,
                    product_id.toString(),
                    language
                ];
                let fields = 'status = ?, finished_at = ?, updated_at = ?, product_info_payload = ?, s3 = ?';
                let condition = 'user_token = ? AND product_id = ? AND language=?';

                db.query(SheinQueue.updateSheinFullQueue(fields, condition), params, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            await new Promise((resolve, reject) => {

                let filename = `${product_id}-${language}-full.json`;
                let request = s3.createPutPublicJsonRequest(SheinBucket, filename, JSON.stringify(product));

                s3.uploadToS3(request)
                    .then((data) => {
                        let params = [
                            'FINISHED',
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            saveToDB ? JSON.stringify(product) : null,
                            `https://${SheinBucket}.s3.us-east-1.amazonaws.com/${filename}`,
                            token,
                            product_id,
                            language
                        ];
                        let fields = 'status = ?, finished_at = ?, updated_at = ?, product_info_payload = ?, s3 = ?';
                        let condition = 'user_token = ? AND product_id = ? AND language=?';

                        db.query(SheinQueue.updateSheinFullQueue(fields, condition), params, (err, data) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    })
                    .catch((err) => {
                        let params = [
                            'FAILED',
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
                            token,
                            product_id,
                            language
                        ];
                        let fields = 'status = ?, failed_at = ?, updated_at = ?';
                        let condition = 'user_token = ? AND product_id = ? AND language=?';

                        db.query(SheinQueue.updateSheinFullQueue(fields, condition), params, (err, data) => {
                            if (err) {
                                // console.log('-------------routes.js: 193--------------', err.message);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
            });
            console.log(`CRAWLER -- Fetching product: ${product_id} completed and successfully pushed to dataset`);
        }
    }
};
