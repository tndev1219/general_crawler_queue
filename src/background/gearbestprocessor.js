let throng = require('throng');
let Queue = require("bull");
var moment = require('moment');
let worker = require('./worker');
var GearbestQueue = require('../domain/gearbestqueue');
var db = require('../db/database');
require('dotenv').config();

let workers = process.env.WEB_CONCURRENCY || 1;
let maxJobsPerWorker = parseInt(process.env.JOBS_PER_WORKER);

let gearbestFullWorkQueue = new Queue('gearbestFullWorker', {
	redis: {
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT
	}
});

let gearbestStockWorkQueue = new Queue('gearbestStockWorker', {
	redis: {
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT
	}
});

function start() {

	gearbestFullWorkQueue.process(maxJobsPerWorker, (data) => {
		try {
			let job = data;
			promise = new Promise((resolve, reject) => {
				worker.gearbestFullWorker(job.data.product, job.opts.token, resolve, reject);
			});

			return promise.then(() => {
				return {
					status: 'finished'
				};
			}).catch((e) => {
				console.log(`Error: We got blocked by target on ${job.data.product.product_url}. The Crawler will retry: attempts number ${job.attemptsMade}`);
				if (job.attemptsMade >= process.env.MAX_RETRY_ATTEMPTS - 1) {
					let params = [
						job.data.product.goodsSn,
						job.data.product.language,
						job.opts.token
					];
					let fields = '*';
					let condition = 'goodsSn=? AND language=? AND user_token=?';
					db.query(GearbestQueue.getGearbestFullQueueSQL(fields, condition), params, (err, data) => {
						if (err) {
							console.log('----------gearbestprocessor.js: 37------------', err.message);
						} else {
							if (data && data.length > 0) {
								let params = [
									'FAILED',
									moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
									moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
									job.opts.token,
									data[0].goodsSn,
									data[0].language
								];
								let fields = 'status = ?, failed_at = ?, updated_at = ?';
								let condition = 'user_token = ? AND goodsSn = ? AND language=?';

								db.query(GearbestQueue.updateGearbestFullQueueSQL(fields, condition), params, (err, data) => {
									if (err) {
										console.log('----------gearbestprocessor.js: 53------------', err.message);
									}
								});
							}
						}
					});
				}
				job.moveToFailed();
			});
		} catch (e) {
			console.log('----------gearbestprocessor.js: 63------------', e.message);
		}
	});

	gearbestStockWorkQueue.process(maxJobsPerWorker, async (data) => {
		try {
			let job = data;
			let promise = new Promise((resolve, reject) => {
				worker.gearbestStockWorker(job.data.product, job.opts.token, resolve, reject);
			});

			return promise.then(() => {
				return {
					status: 'finished'
				};
			}).catch((e) => {
				console.log('----------gearbestprocessor.js: 32------------', e.message);
				console.log(`Error: We got blocked by target on ${job.data.product.goodsSn}. The Crawler will retry: attempts number ${job.attemptsMade}`);
				if (job.attemptsMade >= process.env.MAX_RETRY_ATTEMPTS - 1) {
					let params = [
						job.data.product.goodsSn,
						job.opts.token
					];
					let fields = '*';
					let condition = 'goodsSn=? AND user_token=?';
					db.query(GearbestQueue.getGearbestStockQueueSQL(fields, condition), params, (err, data) => {
						if (err) {
							console.log('----------gearbestprocessor.js: 37------------', err.message);
						} else {
							if (data && data.length > 0) {
								let params = [
									'FAILED',
									moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
									moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
									job.opts.token,
									data[0].goodsSn
								];
								let fields = 'status = ?, failed_at = ?, updated_at = ?';
								let condition = 'user_token = ? AND goodsSn = ?';
								db.query(GearbestQueue.updateGearbestStockQueueSQL(fields, condition), params, (err, data) => {
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
}

throng({
	workers,
	start
});
