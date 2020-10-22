const Queue = require('bull');
require('dotenv').config();

const banggoodFullQueue = new Queue('bangFullWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

banggoodFullQueue.clean(1000)
banggoodFullQueue.clean(1000, 'failed')

console.log('Clean banggood full')
