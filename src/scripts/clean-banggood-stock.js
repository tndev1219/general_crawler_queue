const Queue = require('bull');
require('dotenv').config();

const banggoodStockQueue = new Queue('bangStockWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

banggoodStockQueue.clean(1000)
banggoodStockQueue.clean(1000, 'failed')

console.log('Clean banggood stock')
