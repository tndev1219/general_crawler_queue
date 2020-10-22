const Queue = require('bull');
require('dotenv').config();

const aliStockQueue = new Queue('aliStockWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

aliStockQueue.clean(1000)
aliStockQueue.clean(1000, 'failed')

console.log('Clean aliepress stock')
