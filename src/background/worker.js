var db = require('../db/database');
var AliQueue = require('../domain/aliqueue');
var BangQueue = require('../domain/bangqueue');
var GearbestQueue = require('../domain/gearbestqueue');
var EmmaQueue = require('../domain/emmaqueue');
var SheinQueue = require('../domain/sheinqueue');
var { 
    callActorForAli, 
    callActorForBangStock, 
    callActorForBangFull, 
    callActorForGearbestFull, 
    callActorForGearbestStock, 
    callActorForEmmaFull,
    callActorForSheinStock, 
    callActorForSheinFull 
} = require('../services/main');
var banggood = require('../services/banggood');
var moment = require('moment');

const makeBanggoodStockURL = (productId, vlaueId, warehouse) => {
    var url = `https://www.banggood.com/load/product/ajaxProduct.html?`;
    let qsPayload = `products_id=${productId}&warehouse=${warehouse}`;

    if (vlaueId && vlaueId!='NULL') {
        qsPayload += `&valueId=${vlaueId.split('-').join(',')}`;
    }

    const qs = banggood.encrypter.attachEncrypt(qsPayload);
    url += qs;
    return url;
};

const aliStockWorker = (product, token, resolve, reject) => {
    let params = [
        'RESERVED',
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        token,
        product.code.toString(),
        product.language
    ];
    let fields = 'status = ?, reserved_at = ?, updated_at = ?';
    let condition = 'user_token = ? AND product_code = ? AND language = ?';

    db.query(AliQueue.updateAliStockQueueSQL(fields, condition), params, async (err, data) => {
        try {
            if (err) {
                // console.log('----------worker.js: 36------------', err.message);
                reject(err);
            } else {
                let startUrlList = [];
                let startUrl = product.product_url;

                startUrlList.push({
                    'startUrl': startUrl,
                    'language': product.language,
                    'locale': product.locale,
                    'token': token,
                    'saveToDB': product.saveToDB,
                    'crawling_type': product.crawling_type
                });

                await callActorForAli(startUrlList, resolve, reject);
            }
        } catch (e) {
            // console.log('----------worker.js: 51------------', e.message);
            reject(e);
        }
    });
};

const aliFullWorker = (product, token, resolve, reject) => {
    let params = [
        'RESERVED',
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        token,
        product.code.toString(),
        product.language
    ];
    let fields = 'status = ?, reserved_at = ?, updated_at = ?';
    let condition = 'user_token = ? AND product_code = ? AND language = ?';

    db.query(AliQueue.updateAliFullQueueSQL(fields, condition), params, async (err, data) => {
        try {
            if (err) {
                // console.log('----------worker.js: 36------------', err.message);
                reject(err);
            } else {
                let startUrlList = [];
                let startUrl = product.product_url;

                startUrlList.push({
                    'startUrl': startUrl,
                    'language': product.language,
                    'locale': product.locale,
                    'token': token,
                    'saveToDB': product.saveToDB,
                    'crawling_type': product.crawling_type
                });

                await callActorForAli(startUrlList, resolve, reject);
            }
        } catch (e) {
            // console.log('----------worker.js: 51------------', e.message);
            reject(e);
        }
    });
};

const bangStockWorker = (product, token, resolve, reject) => {
    let params = [
        'RESERVED',
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        token,
        product.product_id.toString(),
        product.variant_id.toString(),
        product.warehouse
    ];
    let fields = 'status = ?, reserved_at = ?, updated_at = ?';
    let condition = 'user_token = ? AND product_id = ? AND variant_id = ? AND warehouse=?';

    db.query(BangQueue.updateBangStockQueue(fields, condition), params, async (err, data) => {
        try {
            if (err) {
                // console.log('----------worker.js: 72------------', err.message);
                reject(err);
            } else {
                let startUrlList = [];
                let startUrl = makeBanggoodStockURL(product.product_id, product.variant_id, product.warehouse);

                startUrlList.push({
                    'startUrl': startUrl,
                    'product_id': product.product_id,
                    'variant_id': product.variant_id,
                    'warehouse': product.warehouse,
                    'country_id': product.country_id,
                    'token': token,
                    'saveToDB': product.saveToDB
                });

                await callActorForBangStock(startUrlList, resolve, reject);
            }
        } catch (e) {
            // console.log('----------worker.js: 88------------', e.message);
            reject(e);
        }
    });
};

const bangFullWorker = (product, token, resolve, reject) => {
    let params = [
        'RESERVED',
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        token,
        product.product_id.toString(),
        product.language
    ];
    let fields = 'status = ?, reserved_at = ?, updated_at = ?';
    let condition = 'user_token = ? AND product_id = ? AND language=?';

    db.query(BangQueue.updateBangFullQueue(fields, condition), params, async (err, data) => {
        try {
            if (err) {
                // console.log('----------worker.js: 120------------', err.message);
                reject(err);
            } else {
                let startUrlList = [];
                let startUrl = product.product_url;

                startUrlList.push({
                    'startUrl': startUrl,
                    'product_id': product.product_id,
                    'language': product.language,
                    'token': token,
                    'saveToDB': product.saveToDB,
                    'country_code': product.country_code,
                    'country_name': product.country_name,
                    'country_id': product.country_id
                });

                await callActorForBangFull(startUrlList, resolve, reject);
            }
        } catch (e) {
            // console.log('----------worker.js: 88------------', e.message);
            reject(e);
        }
    });
};

const gearbestFullWorker = (product, token, resolve, reject) => {
    let params = [
        'RESERVED',
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        token,
        product.goodsSn,
        product.language
    ];
    let fields = 'status = ?, reserved_at = ?, updated_at = ?';
    let condition = 'user_token = ? AND goodsSn = ? AND language = ?';

    db.query(GearbestQueue.updateGearbestFullQueueSQL(fields, condition), params, async (err, data) => {
        try {
            if (err) {
                // console.log('----------worker.js: 36------------', err.message);
                reject(err);
            } else {
                let startUrlList = [];

                startUrlList.push({
                    'startUrl': product.product_url,
                    'goodsSn': product.goodsSn,
                    'language': product.language,
                    'token': token,
                    'saveToDB': product.saveToDB
                });

                await callActorForGearbestFull(startUrlList, resolve, reject);
            }
        } catch (e) {
            // console.log('----------worker.js: 51------------', e.message);
            reject(e);
        }
    });
};

const gearbestStockWorker = (product, token, resolve, reject) => {
    let params = [
        'RESERVED',
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        token,
        product.goodsSn
    ];
    let fields = 'status = ?, reserved_at = ?, updated_at = ?';
    let condition = 'user_token = ? AND goodsSn = ?';

    db.query(GearbestQueue.updateGearbestStockQueueSQL(fields, condition), params, async (err, data) => {
        try {
            if (err) {
                // console.log('----------worker.js: 72------------', err.message);
                reject(err);
            } else {
                let startUrlList = [];

                startUrlList.push({
                    'startUrl': product.product_url,
                    'goodsSn': product.goodsSn,
                    'token': token,
                    'saveToDB': product.saveToDB
                });

                await callActorForGearbestStock(startUrlList, resolve, reject);
            }
        } catch (e) {
            // console.log('----------worker.js: 88------------', e.message);
            reject(e);
        }
    });
};

const emmaFullWorker = (product, token, resolve, reject) => {
    let params = [
        'RESERVED',
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        token,
        product.product_url
    ];
    let fields = 'status = ?, reserved_at = ?, updated_at = ?';
    let condition = 'user_token = ? AND product_url = ?';

    db.query(EmmaQueue.updateEmmaFullQueueSQL(fields, condition), params, async (err, data) => {
        try {
            if (err) {
                // console.log('----------worker.js: 120------------', err.message);
                reject(err);
            } else {
                let startUrlList = [];
                let startUrl = product.product_url;

                startUrlList.push({
                    'startUrl': startUrl,
                    'product_url': product.product_url,
                    'token': token,
                    'saveToDB': product.saveToDB
                }); 

                await callActorForEmmaFull(startUrlList, resolve, reject);
            }
        } catch (e) {
            // console.log('----------worker.js: 88------------', e.message);
            reject(e);
        }
    });
};

const sheinStockWorker = (product, token, resolve, reject) => {
    let params = [
        'RESERVED',
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        token,
        product.product_id
    ];
    let fields = 'status = ?, reserved_at = ?, updated_at = ?';
    let condition = 'user_token = ? AND product_id = ?';

    db.query(SheinQueue.updateSheinStockQueue(fields, condition), params, async (err, data) => {
        try {
            if (err) {
                // console.log('----------worker.js: 72------------', err.message);
                reject(err);
            } else {
                let startUrlList = [];
                let startUrl = product.product_url;

                startUrlList.push({
                    'startUrl': startUrl,
                    'product_id': product.product_id,
                    'token': token,
                    'saveToDB': product.saveToDB
                });

                await callActorForSheinStock(startUrlList, resolve, reject);
            }
        } catch (e) {
            // console.log('----------worker.js: 88------------', e.message);
            reject(e);
        }
    });
};

const sheinFullWorker = (product, token, resolve, reject) => {
    let params = [
        'RESERVED',
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
        token,
        product.product_id.toString(),
        product.language
    ];
    let fields = 'status = ?, reserved_at = ?, updated_at = ?';
    let condition = 'user_token = ? AND product_id = ? AND language=?';

    db.query(SheinQueue.updateSheinFullQueue(fields, condition), params, async (err, data) => {
        try {
            if (err) {
                // console.log('----------worker.js: 120------------', err.message);
                reject(err);
            } else {
                let startUrlList = [];
                let startUrl = product.product_url;

                startUrlList.push({
                    'startUrl': startUrl,
                    'product_id': product.product_id,
                    'language': product.language,
                    'token': token,
                    'saveToDB': product.saveToDB
                });

                await callActorForSheinFull(startUrlList, resolve, reject);
            }
        } catch (e) {
            // console.log('----------worker.js: 88------------', e.message);
            reject(e);
        }
    });
};

module.exports = {
    aliStockWorker,
    aliFullWorker,
    bangStockWorker,
    bangFullWorker,
    gearbestFullWorker,
    gearbestStockWorker,
    emmaFullWorker,
    sheinStockWorker,
    sheinFullWorker,
};
