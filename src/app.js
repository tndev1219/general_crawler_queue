var express = require('express');
var bodyparser = require('body-parser');
var cors = require('cors');
var Queue = require('bull');
var { setQueues, UI } = require('bull-board');
var { router } = require('./api/apis');

const app = express();
require('dotenv').config();

app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));

app.use("/api/v1", router);
app.use('/admin/queues', UI);

//if we are here then the specified request is not found
app.use((req, res, next) => {
    const err = new Error("Not Found");
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    res.status(err.status || 501);
    res.json({
        error: {
            code: err.status || 501,
            message: err.message
        }
    });
});

var aliFullWorkQueue = new Queue('aliFullWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

var aliStockWorkQueue = new Queue('aliStockWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

var bangStockWorkQueue = new Queue('bangStockWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

var bangFullWorkQueue = new Queue('bangFullWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

var gearbestStockWorkQueue = new Queue('gearbestStockWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

var gearbestFullWorkQueue = new Queue('gearbestFullWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

var emmaFullWorkQueue = new Queue('emmaFullWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

var sheinStockWorkQueue = new Queue('sheinStockWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

var sheinFullWorkQueue = new Queue('sheinFullWorker', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

setQueues([
    aliStockWorkQueue,
    aliFullWorkQueue,
    bangStockWorkQueue,
    bangFullWorkQueue,
    gearbestStockWorkQueue,
    gearbestFullWorkQueue,
    emmaFullWorkQueue,
    sheinStockWorkQueue,
    sheinFullWorkQueue
]);

module.exports = app;