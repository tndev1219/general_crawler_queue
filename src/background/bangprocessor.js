let throng = require('throng');
var moment = require('moment');
let Queue = require("bull");
let worker = require('./worker');
var BangQueue = require('../domain/bangqueue');
var db = require('../db/database');
require('dotenv').config();

let workers = process.env.WEB_CONCURRENCY || 1;
let maxJobsPerWorker = parseInt(process.env.JOBS_PER_WORKER);

let bangStockWorkQueue = new Queue('bangStockWorker', {
	redis: {
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT
	}
});

let bangFullWorkQueue = new Queue('bangFullWorker', {
	redis: {
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT
	}
});

function start() {

	bangStockWorkQueue.process(maxJobsPerWorker, async (data) => {
		try {
			let job = data;
			let promise = new Promise((resolve, reject) => {
				worker.bangStockWorker(job.data.product, job.opts.token, resolve, reject);
			});

			return promise.then(() => {
				return {
					status: 'finished'
				};
			}).catch((e) => {
				console.log('----------bangprocessor.js: 32------------', e.message);
				console.log(`Error: We got blocked by target on ${job.data.product.product_id}. The Crawler will retry: attempts number ${job.attemptsMade}`);
				if (job.attemptsMade >= process.env.MAX_RETRY_ATTEMPTS - 1) {
					let params = [
						job.data.product.product_id,
						job.data.product.variant_id,
						job.data.product.warehouse,
						job.opts.token
					];
					let fields = '*';
					let condition = 'product_id=? AND variant_id=? AND warehouse=? AND user_token=?';
					db.query(BangQueue.getBangStockQueueSQL(fields, condition), params, (err, data) => {
						if (err) {
							console.log('----------bangprocessor.js: 37------------', err.message);
						} else {
							if (data && data.length > 0) {
								let params = [
									'FAILED',
									moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
									moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
									job.opts.token,
									data[0].product_id,
									data[0].variant_id,
									data[0].warehouse
								];
								let fields = 'status = ?, failed_at = ?, updated_at = ?';
								let condition = 'user_token = ? AND product_id = ? AND variant_id=? AND warehouse=?';
								db.query(BangQueue.updateBangStockQueue(fields, condition), params, (err, data) => {
									if (err) {
										console.log('----------bangprocessor.js: 53------------', err.message);
									}
								});
							}
						}
					});
				}
				job.moveToFailed();
			});
		} catch (e) {
			console.log('----------bangprocessor.js: 63------------', e.message);
		}
	});

	bangFullWorkQueue.process(maxJobsPerWorker, async (data) => {
		try {
			let job = data;
			let promise = new Promise((resolve, reject) => {
				worker.bangFullWorker(job.data.product, job.opts.token, resolve, reject);
			});

			return promise.then(() => {
				return {
					status: 'finished'
				};
			}).catch((e) => {
				console.log('----------bangprocessor.js: 95------------', e.message);
				console.log(`Error: We got blocked by target on ${job.data.product.product_id}. The Crawler will retry: attempts number ${job.attemptsMade}`);
				if (job.attemptsMade >= process.env.MAX_RETRY_ATTEMPTS - 1) {
					let params = [
						job.data.product.product_id,
						job.data.product.language,
						job.opts.token
					];
					let fields = '*';
					let condition = 'product_id=? AND language=? AND user_token=?';
					db.query(BangQueue.getBangFullQueueSQL(fields, condition), params, (err, data) => {
						if (err) {
							console.log('----------bangprocessor.js: 107------------', err.message);
						} else {
							if (data && data.length > 0) {
								let params = [
									'FAILED',
									moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
									moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
									job.opts.token,
									data[0].product_id,
									data[0].language
								];
								let fields = 'status = ?, failed_at = ?, updated_at = ?';
								let condition = 'user_token = ? AND product_id = ? AND language=?';
								db.query(BangQueue.updateBangFullQueue(fields, condition), params, (err, data) => {
									if (err) {
										console.log('----------bangprocessor.js: 122------------', err.message);
									}
								});
							}
						}
					});
				}
				job.moveToFailed();
			});
		} catch (e) {
			console.log('----------bangprocessor.js: 132------------', e.message);
		}
	});
}

throng({
	workers,
	start
});
