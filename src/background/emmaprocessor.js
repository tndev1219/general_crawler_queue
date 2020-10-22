let throng = require('throng');
var moment = require('moment');
let Queue = require("bull");
let worker = require('./worker');
var EmmaQueue = require('../domain/emmaqueue');
var db = require('../db/database');
require('dotenv').config();

let workers = process.env.WEB_CONCURRENCY || 1;
let maxJobsPerWorker = parseInt(process.env.JOBS_PER_WORKER);

let emmaFullWorkQueue = new Queue('emmaFullWorker', {
	redis: {
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT
	}
});

function start() {
	emmaFullWorkQueue.process(maxJobsPerWorker, async (data) => {
		try {
			let job = data;
			let promise = new Promise((resolve, reject) => {
				worker.emmaFullWorker(job.data.product, job.opts.token, resolve, reject);
			});

			return promise.then(() => {
				return {
					status: 'finished'
				};
			}).catch((e) => {
				console.log('----------emmaprocessor.js: 95------------', e.message);
				console.log(`Error: We got blocked by target on ${job.data.product.product_id}. The Crawler will retry: attempts number ${job.attemptsMade}`);
				if (job.attemptsMade >= process.env.MAX_RETRY_ATTEMPTS - 1) {
					let params = [
						job.data.product.product_url,
						job.opts.token
					];
					let fields = '*';
					let condition = 'product_url=? AND user_token=?';
					db.query(EmmaQueue.getEmmaFullQueueSQL(fields, condition), params, (err, data) => {
						if (err) {
							console.log('----------emmaprocessor.js: 107------------', err.message);
						} else {
							if (data && data.length > 0) {
								let params = [
									'FAILED',
									moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
									moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
									job.opts.token,
									data[0].product_url
								];
								let fields = 'status = ?, failed_at = ?, updated_at = ?';
								let condition = 'user_token = ? AND product_url = ?';
								db.query(EmmaQueue.updateEmmaFullQueueSQL(fields, condition), params, (err, data) => {
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
