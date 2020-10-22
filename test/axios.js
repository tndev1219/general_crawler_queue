//const axios = require('axios');
const Apify = require('apify');
const axios = require('axios-https-proxy-fix');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

axios({
    method: 'GET',
    url: 'https://ifconfig.co/json',
    Connection: 'keep-alive',
    'User-Agent': Apify.utils.getRandomUserAgent(),
    proxy: {
        host: '3.218.142.201',
        port: 24000
    },
    //httpsAgent: new https.Agent({ rejectUnauthorized: false }),
})
.then(function(d){
    console.log(d);
})
.catch(function(e){
    console.log(e);
})
