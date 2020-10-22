const Queue = require('bull');
require('dotenv').config();

const aliFullQueue = new Queue('aliFullWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

aliFullQueue.clean(1000)
aliFullQueue.clean(1000, 'failed')

console.log('Clean aliepress full')
