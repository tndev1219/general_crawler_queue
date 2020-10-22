const HttpsProxyAgent = require('https-proxy-agent');
const routes = require('./routes');

// Create router
exports.createRouter = () => {
    return async (routeName, requestContext) => {
        try {
            const route = routes[routeName];

            if (!route) throw new Error(`------------tools.js: 17------------ No route for name: ${routeName}`);

            return route(requestContext);
        } catch (e) {
            // console.log('------------tools.js: 23-------------', e.message);
            return null;
        }
    };
};

// Creates proxy URL with user input
const createProxyUrl = async (userInput) => {
    try {
        const {
            apifyProxyGroups,
            useApifyProxy,
            proxyUrls
        } = userInput.proxy;
        if (proxyUrls && proxyUrls.length > 0) {
            return proxyUrls[0];
        }
        if (useApifyProxy) {
            return `http://${apifyProxyGroups ? apifyProxyGroups.join(',') : 'auto'}:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`;
        }

        return '';
    } catch (e) {
        console.log(e);
    }
};

// Returns an axios instance with proxy and timeout options set
exports.getProxyAgent = async (userInput) => {
    try {
        const url = await createProxyUrl(userInput);
        return url ? new HttpsProxyAgent(url) : null;
    } catch (e) {
        console.log(e);
    }
};

exports.getUnique = (array) => {
    var uniqueArray = [];

    // Loop through array values
    for (i = 0; i < array.length; i++) {
        if (uniqueArray.indexOf(array[i]) === -1) {
            uniqueArray.push(array[i]);
        }
    }
    return uniqueArray;
};

// Detects url and map them to routes
exports.mapStartUrlsForAli = (startUrls) => {
    return startUrls.map((startUrl) => {
        try {
            const link = startUrl.url;
            let routeType = '';
            let userData = {};

            if (link.includes('/item/')) {
                startUrl.crawling_type === 'full' ? routeType = 'ALIEXPRESSFULL' : routeType = 'ALIEXPRESSSTOCK';
                userData = {
                    baseUrl: link,
                    productId: link.split('/item/')[1].split('.htm')[0],
                    token: startUrl.token,
                    saveToDB: startUrl.saveToDB,
                    locale: startUrl.locale
                };
            } else {
                throw new Error('--------------tools.js: 76------------- Wrong URL provided to Start URLS!');
            }

            if (startUrl.url.split('https://')[1].split('.aliexpress')[0] === 'www') {
                userData.language = 'EN';
                userData.locale = 'en_US';
            } else {
                userData.language = startUrl.language;
            }

            userData.label = routeType;

            return {
                uniqueKey: link,
                url: link,
                userData,
            };
        } catch (e) {
            // console.log('--------------tools.js: 93--------------', e.message);
            return null;
        }
    });
};

// Detects url and map them to routes
exports.mapStartUrlsForBangStock = (startUrls) => {
    return startUrls.map((startUrl) => {
        try {
            const link = startUrl.url;
            let routeType = '';
            let userData = {};

            routeType = 'BANGGOODSTOCK';
            userData = {
                product_id: startUrl.product_id,
                variant_id: startUrl.variant_id,
                warehouse: startUrl.warehouse,
                country_id: startUrl.country_id,
                token: startUrl.token,
                saveToDB: startUrl.saveToDB
            };

            userData.label = routeType;

            return {
                uniqueKey: link,
                url: link,
                userData,
            };
        } catch (e) {
            // console.log('--------------tools.js: 126--------------', e.message);
            return null;
        }
    });
};

exports.mapStartUrlsForBangFull = (startUrls) => {
    return startUrls.map((startUrl) => {
        try {
            const link = startUrl.url;
            let routeType = '';
            let userData = {};

            routeType = 'BANGGOODFULL';
            userData = {
                product_id: startUrl.product_id,
                language: startUrl.language,
                token: startUrl.token,
                saveToDB: startUrl.saveToDB,
                country_code: startUrl.country_code,
                country_name: startUrl.country_name,
                country_id: startUrl.country_id
            };

            userData.label = routeType;

            return {
                uniqueKey: link,
                url: link,
                userData,
            };
        } catch (e) {
            // console.log('--------------tools.js: 126--------------', e.message);
            return null;
        }
    });
};

exports.mapStartUrlsForGearbestFull = (startUrls) => {
    return startUrls.map((startUrl) => {
        try {
            const link = startUrl.url;
            let routeType = '';
            let userData = {};

            routeType = 'GEARBESTFULL';
            userData = {
                goodsSn: startUrl.goodsSn,
                language: startUrl.language,
                token: startUrl.token,
                saveToDB: startUrl.saveToDB
            };

            userData.label = routeType;

            return {
                uniqueKey: link,
                url: link,
                userData,
            };
        } catch (e) {
            // console.log('--------------tools.js: 126--------------', e.message);
            return null;
        }
    });
};

exports.mapStartUrlsForGearbestStock = (startUrls) => {
    return startUrls.map((startUrl) => {
        try {
            const link = startUrl.url;
            let routeType = '';
            let userData = {};

            routeType = 'GEARBESTSTOCK';
            userData = {
                goodsSn: startUrl.goodsSn,
                token: startUrl.token,
                saveToDB: startUrl.saveToDB
            };

            userData.label = routeType;

            return {
                uniqueKey: link,
                url: link,
                userData,
            };
        } catch (e) {
            // console.log('--------------tools.js: 126--------------', e.message);
            return null;
        }
    });
};

exports.mapStartUrlsForEmmaFull = (startUrls) => {
    return startUrls.map((startUrl) => {
        try {
            const link = startUrl.url;
            let routeType = '';
            let userData = {};

            routeType = 'EMMAFULL';
            userData = {
                product_url: startUrl.product_url,
                token: startUrl.token,
                saveToDB: startUrl.saveToDB
            };

            userData.label = routeType;

            return {
                uniqueKey: link,
                url: link,
                userData,
            };
        } catch (e) {
            // console.log('--------------tools.js: 126--------------', e.message);
            return null;
        }
    });
};

exports.mapStartUrlsForSheinStock = (startUrls) => {
    return startUrls.map((startUrl) => {
        try {
            const link = startUrl.url;
            let routeType = '';
            let userData = {};

            routeType = 'SHEINSTOCK';
            userData = {
                product_id: startUrl.product_id,
                token: startUrl.token,
                saveToDB: startUrl.saveToDB
            };

            userData.label = routeType;

            return {
                uniqueKey: link,
                url: link,
                userData,
            };
        } catch (e) {
            // console.log('--------------tools.js: 126--------------', e.message);
            return null;
        }
    });
};

exports.mapStartUrlsForSheinFull = (startUrls) => {
    return startUrls.map((startUrl) => {
        try {
            const link = startUrl.url;
            let routeType = '';
            let userData = {};

            routeType = 'SHEINFULL';
            userData = {
                product_id: startUrl.product_id,
                language: startUrl.language,
                token: startUrl.token,
                saveToDB: startUrl.saveToDB
            };

            userData.label = routeType;

            return {
                uniqueKey: link,
                url: link,
                userData,
            };
        } catch (e) {
            // console.log('--------------tools.js: 126--------------', e.message);
            return null;
        }
    });
};
