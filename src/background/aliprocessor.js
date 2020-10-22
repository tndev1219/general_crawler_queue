let throng = require('throng');
let Queue = require("bull");
var moment = require('moment');
let worker = require('./worker');
var AliQueue = require('../domain/aliqueue');
var db = require('../db/database');
require('dotenv').config();

let workers = process.env.WEB_CONCURRENCY || 1;
let maxJobsPerWorker = parseInt(process.env.JOBS_PER_WORKER);

let aliFullWorkQueue = new Queue('aliFullWorker', {
	redis: {
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT
	}
});

let aliStockWorkQueue = new Queue('aliStockWorker', {
	redis: {
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT
	}
});

function start() {

	aliFullWorkQueue.process(maxJobsPerWorker, (data) => {
		try {
			let job = data;
			promise = new Promise((resolve, reject) => {
				worker.aliFullWorker(job.data.product, job.opts.token, resolve, reject);
			});

			return promise.then(() => {
				return {
					status: 'finished'
				};
			}).catch((e) => {
				console.log('----------aliprocessor.js: 32------------', e);
				console.log(`Error: We got blocked by target on ${job.data.product.product_url}. The Crawler will retry: attempts number ${job.attemptsMade}`);
				if (job.attemptsMade >= process.env.MAX_RETRY_ATTEMPTS - 1) {
					let params = [
						job.data.product.code,
						job.data.product.language,
						job.opts.token
					];
					let fields = '*';
					let condition = 'product_code=? AND language=? AND user_token=?';
					db.query(AliQueue.getAliFullQueueSQL(fields, condition), params, (err, data) => {
						if (err) {
							console.log('----------aliprocessor.js: 37------------', err.message);
						} else {
							if (data && data.length > 0) {
								let params = [
									'FAILED',
									moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
									moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
									job.opts.token,
									data[0].product_code,
									data[0].language
								];
								let fields = 'status = ?, failed_at = ?, updated_at = ?';
								let condition = 'user_token = ? AND product_code = ? AND language=?';

								db.query(AliQueue.updateAliFullQueueSQL(fields, condition), params, (err, data) => {
									if (err) {
										console.log('----------aliprocessor.js: 53------------', err.message);
									}
								});
							}
						}
					});
				}
				job.moveToFailed();
			});
		} catch (e) {
			console.log('----------aliprocessor.js: 63------------', e.message);
		}
	});

	aliStockWorkQueue.process(maxJobsPerWorker, (data) => {
		try {
			let job = data;
			promise = new Promise((resolve, reject) => {
				worker.aliStockWorker(job.data.product, job.opts.token, resolve, reject);
			});

			return promise.then(() => {
				return {
					status: 'finished'
				};
			}).catch((e) => {
				console.log('----------aliprocessor.js: 32------------', e);
				console.log(`Error: We got blocked by target on ${job.data.product.product_url}. The Crawler will retry: attempts number ${job.attemptsMade}`);
				if (job.attemptsMade >= process.env.MAX_RETRY_ATTEMPTS - 1) {
					let params = [
						job.data.product.code,
						job.data.product.language,
						job.opts.token
					];
					let fields = '*';
					let condition = 'product_code=? AND language=? AND user_token=?';
					db.query(AliQueue.getAliStockQueueSQL(fields, condition), params, (err, data) => {
						if (err) {
							console.log('----------aliprocessor.js: 37------------', err.message);
						} else {
							if (data && data.length > 0) {
								let params = [
									'FAILED',
									moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
									moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
									job.opts.token,
									data[0].product_code,
									data[0].language
								];
								let fields = 'status = ?, failed_at = ?, updated_at = ?';
								let condition = 'user_token = ? AND product_code = ? AND language=?';

								db.query(AliQueue.updateAliStockQueueSQL(fields, condition), params, (err, data) => {
									if (err) {
										console.log('----------aliprocessor.js: 53------------', err.message);
									}
								});
							}
						}
					});
				}
				job.moveToFailed();
			});
		} catch (e) {
			console.log('----------aliprocessor.js: 63------------', e.message);
		}
	});
}

throng({
	workers,
	start
});
