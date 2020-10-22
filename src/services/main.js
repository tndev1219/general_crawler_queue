const Apify = require('apify');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const tools = require('./tools');
const superagent = require('superagent');
require('superagent-proxy')(superagent);
const axios = require('axios');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const callActorForAli = async (urls, resolve, reject) => {
    try {
        const sourceUrls = urls.map((url) => ({
            "url": url.startUrl,
            "language": url.language,
            "locale": url.locale,
            "token": url.token,
            "saveToDB": url.saveToDB,
            "crawling_type": url.crawling_type
        }));

        var userInput = await Apify.getInput();
        userInput = Object.assign({}, userInput, {
            "startUrls": sourceUrls
        });

        // Fetch start urls
        const {
            startUrls
        } = userInput;

        var mappedStartUrls = [];

        if (startUrls.length === 0) {
            throw new Error('-----------main.js: 41------------', 'Start URLs must be defined');
        } else {
            mappedStartUrls = tools.mapStartUrlsForAli(startUrls);

            // Check Valid Array
            for (var mappedStartUrl of mappedStartUrls) {
                if (!mappedStartUrl) {
                    var error = {};
                    error.message = "Invalid RequestQueue";
                    reject(error);
                    break;
                }
            }
        }

        // Create route
        const router = tools.createRouter();

        if (!router) {
            var error = {};
            error.message = "Not Registered Router";
            reject(error);
        }

        const cheerioCrawler = async (mappedStartUrls) => {
            try {
                for (let mappedStartUrl of mappedStartUrls) {
                    let response = '';
                    console.log('ALI URL', mappedStartUrl)
                    try {
                        response = await superagent.get(mappedStartUrl.url)
                            .set('Cookie', 'aep_usuc_f=site=glo&c_tp=USD&b_locale=' + mappedStartUrl.userData.locale)
                            .proxy(userInput.proxy.proxyUrls[0]);
                    } catch (e) {
                        // console.log('----------main.js: 74-------------', e.message);
                        reject(e);
                    } finally {
                        if (response) {
                            let $ = cheerio.load(response.text);
                            let context = {};
                            let request = {};
                            let content = response.text;
                            let requestUrl = response.request.url;

                            context.request = request;
                            context.request.userData = mappedStartUrl.userData;
                            context.request.url = mappedStartUrl.url;

                            // Status code check
                            if (!response || response.status !== 200 || $('body').data('spm') === 'buyerloginandregister') {
                                throw new Error(`----------main.js: 92------------- We got blocked by target on ${requestUrl}`);
                            }

                            if (request.userData.label !== 'ALIDESCRIPTION' && !content.includes('runParams')) {
                                throw new Error(`----------main.js: 96------------- We got blocked by target on ${requestUrl}`);
                            }

                            if ($('html').text().includes('/_____tmd_____/punish')) {
                                throw new Error(`----------main.js: 100------------- We got blocked by target on ${requestUrl}`);
                            }

                            // prepare dataScript to get product info
                            context.dataScript = content.split('window.runParams = ')[1].split('var GaData')[0].replace(/};/g, '}');

                            // Add user input to context
                            context.userInput = userInput;

                            // Redirect to route
                            await router(request.userData.label, context);
                            resolve();
                        }
                    }
                }
            } catch (e) {
                // console.log('----------main.js: 119-------------', e.message);
                reject(e);
            }
        };

        const puppeteerCrawler = async (mappedStartUrls) => {
            try {
                const browser = await puppeteer.launch({
                    headless: false,
                    slowMo: 100,
                    args: [
                        `--proxy-server=${userInput.proxy.proxyUrls[0]}`,
                        '--ignore-certificate-errors'
                    ],
                    timeout: 60000
                });

                const page = await browser.newPage();

                for (let mappedStartUrl of mappedStartUrls) {
                    let response = '';

                    try {
                        response = await page.goto(mappedStartUrl.url, {
                            waitUntil: 'networkidle2',
                            timeout: 300 * 1000
                        });
                    } catch (e) {
                        // console.log('----------main.js: 147-------------', e.message);
                        reject(e);
                    } finally {
                        if (response) {
                            let context = {};
                            let request = {};
                            let content = await page.content();
                            let requestUrl = await page.url();

                            context.request = request;
                            context.request.userData = mappedStartUrl.userData;
                            context.request.url = mappedStartUrl.url;

                            if (!response || response.status() !== 200 || requestUrl.includes('login.') || !content.includes('data-spm="detail"')) {
                                throw new Error(`----------main.js: 163------------- We got blocked by target on ${requestUrl}`);
                            }

                            if (mappedStartUrl.userData.label !== 'ALIDESCRIPTION' && !content.includes('runParams')) {
                                throw new Error(`----------main.js: 167------------- We got blocked by target on ${requestUrl}`);
                            }

                            if (content.includes('/_____tmd_____/punish')) {
                                throw new Error(`----------main.js: 171------------- We got blocked by target on ${requestUrl}`);
                            }

                            // prepare dataScript to get product info
                            context.dataScript = content.split('window.runParams = ')[1].split('var GaData')[0].replace(/;/g, '');

                            // Add user input to context
                            context.userInput = userInput;

                            // Redirect to route
                            await router(mappedStartUrl.userData.label, context);
                            resolve();
                        }
                    }
                }

                await browser.close();
            } catch (e) {
                // console.log('----------main.js: 192-------------', e.message);
                reject(e);
            }
        };

        process.env.USE_CHEERIO === 'TRUE' ? await cheerioCrawler(mappedStartUrls) : await puppeteerCrawler(mappedStartUrls)
    } catch (e) {
        // console.log('----------main.js: 203-------------', e.message);
        reject(e);
    }
};

const callActorForBangStock = async (urls, resolve, reject) => {
    try {
        const sourceUrls = urls.map((url) => ({
            "url": url.startUrl,
            "product_id": url.product_id,
            "variant_id": url.variant_id,
            "warehouse": url.warehouse,
            "country_id": url.country_id,
            "token": url.token,
            "saveToDB": url.saveToDB
        }));

        var userInput = await Apify.getInput();
        userInput = Object.assign({}, userInput, {
            "startUrls": sourceUrls
        });

        // Fetch start urls
        const {
            startUrls
        } = userInput;

        var mappedStartUrls = [];

        if (startUrls.length === 0) {
            throw new Error('-----------main.js: 231------------', 'Start URLs must be defined');
        } else {
            mappedStartUrls = tools.mapStartUrlsForBangStock(startUrls);

            // Check Valid Array
            for (var mappedStartUrl of mappedStartUrls) {
                if (!mappedStartUrl) {
                    var error = {};
                    error.message = "Invalid RequestQueue";
                    reject(error);
                }
            }
        }

        // Create route
        const router = tools.createRouter();

        if (!router) {
            var error = {};
            error.message = "Not Registered Router";
            reject(error);
        }

        const cheerioCrawler = async (mappedStartUrls) => {
            try {
                for (let mappedStartUrl of mappedStartUrls) {
                    let response = '';

                    try {
                        response = await superagent.get(mappedStartUrl.url)
                            .set('accept', 'application/json, text/javascript, */*; q=0.01')
                            .set('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36')
                            .set('X-Requested-With', 'XMLHttpRequest')
                            .set('Cookie', `default_ship_country=${mappedStartUrl.userData.country_id};`)
                            .proxy(userInput.proxy.proxyUrls[0]);
                    } catch (e) {
                        // console.log('----------main.js: 263-------------', e.message);
                        reject(e);
                    } finally {
                        if (response) {
                            let context = {};
                            let request = {};
                            let content = response.text;
                            let requestUrl = response.request.url;

                            context.request = request;
                            context.request.userData = mappedStartUrl.userData;
                            context.request.url = mappedStartUrl.url;

                            // Status code check
                            if (!response || response.status !== 200) {
                                throw new Error(`----------main.js: 281------------- We got blocked by target on ${requestUrl}`);
                            }

                            // prepare dataScript to get product info
                            context.dataScript = content;

                            // Add user input to context
                            context.userInput = userInput;

                            // Redirect to route
                            await router(request.userData.label, context);
                            resolve();
                        }
                    }
                }
            } catch (e) {
                // console.log('----------main.js: 300-------------', e.message);
                reject(e);
            }
        };

        await cheerioCrawler(mappedStartUrls);
    } catch (e) {
        // console.log('----------main.js: 311-------------', e.message);
        reject(e);
    }
};

const callActorForBangFull = async (urls, resolve, reject) => {
    try {
        const sourceUrls = urls.map((url) => ({
            "url": url.startUrl,
            "product_id": url.product_id,
            "language": url.language,
            "token": url.token,
            "saveToDB": url.saveToDB,
            'country_code': url.country_code,
            'country_name': url.country_name,
            'country_id': url.country_id
        }));

        var userInput = await Apify.getInput();
        userInput = Object.assign({}, userInput, {
            "startUrls": sourceUrls
        });

        // Fetch start urls
        const {
            startUrls
        } = userInput;

        var mappedStartUrls = [];

        if (startUrls.length === 0) {
            throw new Error('-----------main.js: 231------------', 'Start URLs must be defined');
        } else {
            mappedStartUrls = tools.mapStartUrlsForBangFull(startUrls);

            // Check Valid Array
            for (var mappedStartUrl of mappedStartUrls) {
                if (!mappedStartUrl) {
                    var error = {};
                    error.message = "Invalid RequestQueue";
                    reject(error);
                }
            }
        }

        // Create route
        const router = tools.createRouter();

        if (!router) {
            var error = {};
            error.message = "Not Registered Router";
            reject(error);
        }

        const cheerioCrawler = async (mappedStartUrls) => {
            try {
                for (let mappedStartUrl of mappedStartUrls) {
                    let response = '';

                    try {
                        var date = new Date();
                        date.setMonth(date.getMonth() + 1);
                        response = await superagent.get(mappedStartUrl.url)
                            .set('Cookie', `default_ship_country=${mappedStartUrl.userData.country_id}; last_default_ship_country=${mappedStartUrl.userData.country_id}; countryCookie=%7B%22code%22%3A%22${mappedStartUrl.userData.country_code}%22%2C%22name%22%3A%22${mappedStartUrl.userData.country_name}%22%2C%22currency%22%3A%22USD%22%7D; currency=USD; domain=www.banggood.com; hostOnly=true; path=/; secure=false; httpOnly=false; sameSite=no_restriction; session=false; firstPartyDomain=""; expirationdate=${date.getTime()}; storeId=null`)
                            .proxy(userInput.proxy.proxyUrls[0]);
                    } catch (e) {
                        // console.log('----------main.js: 263-------------', e.message);
                        if (e.response.status === 404) {
                            response = null;
                        } else {
                            reject(e);
                        }
                    } finally {
                        if (response) {
                            let $ = cheerio.load(response.text);
                            let context = {};
                            let request = {};
                            let requestUrl = response.request.url;

                            context.request = request;
                            context.request.userData = mappedStartUrl.userData;
                            context.request.url = mappedStartUrl.url;

                            // Status code check
                            if (!response || response.status !== 200) {
                                throw new Error(`----------main.js: 281------------- We got blocked by target on ${requestUrl}`);
                            }

                            // prepare dataScript to get product info
                            context.dataScript = $;

                            // Add user input to context
                            context.userInput = userInput;

                            // Redirect to route
                            await router(request.userData.label, context);
                            resolve();
                        } else if (response === null) {
                            let context = {};
                            let request = {};

                            context.request = request;
                            context.request.userData = mappedStartUrl.userData;
                            context.request.url = mappedStartUrl.url;
                            context.dataScript = response;
                            context.userInput = userInput;

                            await router(request.userData.label, context);
                            resolve();
                        }
                    }
                }
            } catch (e) {
                // console.log('----------main.js: 300-------------', e.message);
                reject(e);
            }
        };

        await cheerioCrawler(mappedStartUrls);
    } catch (e) {
        // console.log('----------main.js: 311-------------', e.message);
        reject(e);
    }
};

const callActorForGearbestFull = async (urls, resolve, reject) => {
    try {
        const sourceUrls = urls.map((url) => ({
            "url": url.startUrl,
            "goodsSn": url.goodsSn,
            "language": url.language,
            "token": url.token,
            "saveToDB": url.saveToDB
        }));

        var userInput = await Apify.getInput();
        userInput = Object.assign({}, userInput, {
            "startUrls": sourceUrls
        });

        // Fetch start urls
        const {
            startUrls
        } = userInput;

        var mappedStartUrls = [];

        if (startUrls.length === 0) {
            throw new Error('-----------main.js: 41------------', 'Start URLs must be defined');
        } else {
            mappedStartUrls = tools.mapStartUrlsForGearbestFull(startUrls);

            // Check Valid Array
            for (var mappedStartUrl of mappedStartUrls) {
                if (!mappedStartUrl) {
                    var error = {};
                    error.message = "Invalid RequestQueue";
                    reject(error);
                    break;
                }
            }
        }

        // Create route
        const router = tools.createRouter();

        if (!router) {
            var error = {};
            error.message = "Not Registered Router";
            reject(error);
        }

        const cheerioCrawler = async (mappedStartUrls) => {
            try {
                for (let mappedStartUrl of mappedStartUrls) {
                    let response = '';
                    try {
                        var date = new Date();
                        date.setMonth(date.getMonth() + 1);
                        response = await superagent.get(mappedStartUrl.url)
                            .set('Cookie', `gb_countryCode=US; gb_currencyCode=USD; domain=.gearbest.com; hostOnly=false; path=/; secure=false; httpOnly=false; sameSite=no_restriction; session=false; firstPartyDomain=""; expirationDate=${date.getTime()}; storeId=null`)
                            .proxy(userInput.proxy.proxyUrls[0]);
                    } catch (e) {
                        reject(e);
                    } finally {
                        if (response) {
                            let $ = cheerio.load(response.text);
                            let context = {};
                            let request = {};
                            let content = response.text;
                            let requestUrl = response.request.url;

                            context.request = request;
                            context.request.userData = mappedStartUrl.userData;
                            context.request.url = mappedStartUrl.url;

                            // Status code check
                            if (!response || response.status !== 200 || !content.includes('goodsLink')) {
                                throw new Error(`We got blocked by target on ${requestUrl}`);
                            }

                            // prepare dataScript to get product info
                            context.dataScript = $;

                            // Add user input to context
                            context.userInput = userInput;

                            // Redirect to route
                            await router(request.userData.label, context);
                            resolve();
                        }
                    }
                }
            } catch (e) {
                // console.log('----------main.js: 119-------------', e.message);
                reject(e);
            }
        };

        await cheerioCrawler(mappedStartUrls);
    } catch (e) {
        // console.log('----------main.js: 203-------------', e.message);
        reject(e);
    }
};

const callActorForGearbestStock = async (urls, resolve, reject) => {
    try {
        const sourceUrls = urls.map((url) => ({
            "url": url.startUrl,
            "goodsSn": url.goodsSn,
            "token": url.token,
            "saveToDB": url.saveToDB
        }));

        var userInput = await Apify.getInput();
        userInput = Object.assign({}, userInput, {
            "startUrls": sourceUrls
        });

        // Fetch start urls
        const {
            startUrls
        } = userInput;

        var mappedStartUrls = [];

        if (startUrls.length === 0) {
            throw new Error('-----------main.js: 41------------', 'Start URLs must be defined');
        } else {
            mappedStartUrls = tools.mapStartUrlsForGearbestStock(startUrls);

            // Check Valid Array
            for (var mappedStartUrl of mappedStartUrls) {
                if (!mappedStartUrl) {
                    var error = {};
                    error.message = "Invalid RequestQueue";
                    reject(error);
                    break;
                }
            }
        }

        // Create route
        const router = tools.createRouter();

        if (!router) {
            var error = {};
            error.message = "Not Registered Router";
            reject(error);
        }

        const cheerioCrawler = async (mappedStartUrls) => {
            try {
                for (let mappedStartUrl of mappedStartUrls) {
                    let response = '';
                    try {
                        response = await axios({
                            method: 'get',
                            url: mappedStartUrl.url,
                            proxy: {
                                host: userInput.proxy.proxyUrls[0]
                            }
                        })
                    } catch (e) {
                        reject(e);
                    } finally {
                        if (response) {
                            let context = {};
                            let request = {};
                            let content = response.data;
                            let requestUrl = response.request.url;

                            context.request = request;
                            context.request.userData = mappedStartUrl.userData;
                            context.request.url = mappedStartUrl.url;

                            // Status code check
                            if (!response || response.status !== 200) {
                                throw new Error(`We got blocked by target on ${requestUrl}`);
                            }

                            // prepare dataScript to get product info
                            context.dataScript = content.split('(')[1] ? content.split('(')[1].split(')')[0] : null;

                            // Add user input to context
                            context.userInput = userInput;

                            // Redirect to route
                            await router(request.userData.label, context);
                            resolve();
                        }
                    }
                }
            } catch (e) {
                reject(e);
            }
        };

        await cheerioCrawler(mappedStartUrls);
    } catch (e) {
        reject(e);
    }
};

const callActorForEmmaFull = async (urls, resolve, reject) => {
    try {
        const sourceUrls = urls.map((url) => ({
            "url": url.startUrl,
            "product_url": url.product_url,
            "token": url.token,
            "saveToDB": url.saveToDB
        }));

        var userInput = await Apify.getInput();
        userInput = Object.assign({}, userInput, {
            "startUrls": sourceUrls
        });

        // Fetch start urls
        const {
            startUrls
        } = userInput;

        var mappedStartUrls = [];

        if (startUrls.length === 0) {
            throw new Error('-----------main.js: 231------------', 'Start URLs must be defined');
        } else {
            mappedStartUrls = tools.mapStartUrlsForEmmaFull(startUrls);

            // Check Valid Array
            for (var mappedStartUrl of mappedStartUrls) {
                if (!mappedStartUrl) {
                    var error = {};
                    error.message = "Invalid RequestQueue";
                    reject(error);
                }
            }
        }

        // Create route
        const router = tools.createRouter();

        if (!router) {
            var error = {};
            error.message = "Not Registered Router";
            reject(error);
        }

        const cheerioCrawler = async (mappedStartUrls) => {
            try {
                for (let mappedStartUrl of mappedStartUrls) {
                    let response = '';

                    try {
                        var date = new Date();
                        date.setMonth(date.getMonth() + 1);
                        response = await superagent.get(mappedStartUrl.url)
                            .proxy(userInput.proxy.proxyUrls[0]);
                    } catch (e) {
                        // console.log('----------main.js: 263-------------', e.message);
                        if (e.response.status === 404) {
                            response = null;
                        } else {
                            reject(e);
                        }
                    } finally {
                        if (response) {
                            let $ = cheerio.load(response.text);
                            let context = {};
                            let request = {};
                            let requestUrl = response.request.url;

                            context.request = request;
                            context.request.userData = mappedStartUrl.userData;
                            context.request.url = mappedStartUrl.url;

                            // Status code check
                            if (!response || response.status !== 200) {
                                throw new Error(`----------main.js: 281------------- We got blocked by target on ${requestUrl}`);
                            }

                            // prepare dataScript to get product info
                            context.dataScript = $;

                            // Add user input to context
                            context.userInput = userInput;

                            // Redirect to route
                            await router(request.userData.label, context);
                            resolve();
                        } else if (response === null) {
                            let context = {};
                            let request = {};

                            context.request = request;
                            context.request.userData = mappedStartUrl.userData;
                            context.request.url = mappedStartUrl.url;
                            context.dataScript = response;
                            context.userInput = userInput;

                            await router(request.userData.label, context);
                            resolve();
                        }
                    }
                }
            } catch (e) {
                // console.log('----------main.js: 300-------------', e.message);
                reject(e);
            }
        };

        await cheerioCrawler(mappedStartUrls);
    } catch (e) {
        // console.log('----------main.js: 311-------------', e.message);
        reject(e);
    }
};

const callActorForSheinStock = async (urls, resolve, reject) => {
    try {
        const sourceUrls = urls.map((url) => ({
            "url": url.startUrl,
            "product_id": url.product_id,
            "token": url.token,
            "saveToDB": url.saveToDB
        }));

        var userInput = await Apify.getInput();
        userInput = Object.assign({}, userInput, {
            "startUrls": sourceUrls
        });

        // Fetch start urls
        const {
            startUrls
        } = userInput;

        var mappedStartUrls = [];

        if (startUrls.length === 0) {
            throw new Error('-----------main.js: 231------------', 'Start URLs must be defined');
        } else {
            mappedStartUrls = tools.mapStartUrlsForSheinStock(startUrls);

            // Check Valid Array
            for (var mappedStartUrl of mappedStartUrls) {
                if (!mappedStartUrl) {
                    var error = {};
                    error.message = "Invalid RequestQueue";
                    reject(error);
                }
            }
        }

        // Create route
        const router = tools.createRouter();

        if (!router) {
            var error = {};
            error.message = "Not Registered Router";
            reject(error);
        }

        const cheerioCrawler = async (mappedStartUrls) => {
            try {
                for (let mappedStartUrl of mappedStartUrls) {
                    let response = '';

                    try {
                        response = await superagent.post(mappedStartUrl.url)
                            .set('Cookie', `default_currency=USD; currency=USD;`)
                            .proxy(userInput.proxy.proxyUrls[0]);
                    } catch (e) {
                        // console.log('----------main.js: 263-------------', e.message);
                        reject(e);
                    } finally {
                        if (response) {
                            let context = {};
                            let request = {};
                            let content = response.text;
                            let requestUrl = response.request.url;

                            context.request = request;
                            context.request.userData = mappedStartUrl.userData;
                            context.request.url = mappedStartUrl.url;

                            // Status code check
                            if (!response || response.status !== 200) {
                                throw new Error(`----------main.js: 281------------- We got blocked by target on ${requestUrl}`);
                            }

                            // prepare dataScript to get product info
                            context.dataScript = content;

                            // Add user input to context
                            context.userInput = userInput;

                            // Redirect to route
                            await router(request.userData.label, context);
                            resolve();
                        }
                    }
                }
            } catch (e) {
                // console.log('----------main.js: 300-------------', e.message);
                reject(e);
            }
        };

        await cheerioCrawler(mappedStartUrls);
    } catch (e) {
        // console.log('----------main.js: 311-------------', e.message);
        reject(e);
    }
};

const callActorForSheinFull = async (urls, resolve, reject) => {
    try {
        const sourceUrls = urls.map((url) => ({
            "url": url.startUrl,
            "product_id": url.product_id,
            "language": url.language,
            "token": url.token,
            "saveToDB": url.saveToDB
        }));

        var userInput = await Apify.getInput();
        userInput = Object.assign({}, userInput, {
            "startUrls": sourceUrls
        });

        // Fetch start urls
        const {
            startUrls
        } = userInput;

        var mappedStartUrls = [];

        if (startUrls.length === 0) {
            throw new Error('-----------main.js: 231------------', 'Start URLs must be defined');
        } else {
            mappedStartUrls = tools.mapStartUrlsForSheinFull(startUrls);

            // Check Valid Array
            for (var mappedStartUrl of mappedStartUrls) {
                if (!mappedStartUrl) {
                    var error = {};
                    error.message = "Invalid RequestQueue";
                    reject(error);
                }
            }
        }

        // Create route
        const router = tools.createRouter();

        if (!router) {
            var error = {};
            error.message = "Not Registered Router";
            reject(error);
        }

        const cheerioCrawler = async (mappedStartUrls) => {
            try {
                for (let mappedStartUrl of mappedStartUrls) {
                    let response = '';

                    try {
                        var date = new Date();
                        date.setMonth(date.getMonth() + 1);
                        response = await superagent.get(mappedStartUrl.url)
                            .proxy(userInput.proxy.proxyUrls[0]);
                    } catch (e) {
                        // console.log('----------main.js: 263-------------', e.message);
                        if (e.response.status === 404) {
                            response = null;
                        } else {
                            reject(e);
                        }
                    } finally {
                        if (response) {
                            let $ = cheerio.load(response.text);
                            let context = {};
                            let request = {};
                            let requestUrl = response.request.url;

                            context.request = request;
                            context.request.userData = mappedStartUrl.userData;
                            context.request.url = mappedStartUrl.url;

                            // Status code check
                            if (!response || response.status !== 200) {
                                throw new Error(`----------main.js: 281------------- We got blocked by target on ${requestUrl}`);
                            }

                            // prepare dataScript to get product info
                            context.dataScript = $;

                            // Add user input to context
                            context.userInput = userInput;

                            // Redirect to route
                            await router(request.userData.label, context);
                            resolve();
                        } else if (response === null) {
                            let context = {};
                            let request = {};

                            context.request = request;
                            context.request.userData = mappedStartUrl.userData;
                            context.request.url = mappedStartUrl.url;
                            context.dataScript = response;
                            context.userInput = userInput;

                            await router(request.userData.label, context);
                            resolve();
                        }
                    }
                }
            } catch (e) {
                // console.log('----------main.js: 300-------------', e.message);
                reject(e);
            }
        };

        await cheerioCrawler(mappedStartUrls);
    } catch (e) {
        // console.log('----------main.js: 311-------------', e.message);
        reject(e);
    }
};

module.exports = { 
    callActorForAli, 
    callActorForBangStock, 
    callActorForBangFull, 
    callActorForGearbestFull, 
    callActorForGearbestStock, 
    callActorForEmmaFull,
    callActorForSheinStock, 
    callActorForSheinFull
};
