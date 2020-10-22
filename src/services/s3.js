var AWS = require('aws-sdk');
require('dotenv').config();

var AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
var AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

var s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
});

createPutPublicJsonRequest = (location, filename, contents) => {
    const request = {
        Bucket: location,
        Key: filename,
        Body: contents,
        ContentType: 'application/json; charset=utf-8',
        CacheControl: 'no-cache'
    };

    return request;
};

createGetPublicJsonRequest = (location, filename) => {
    const request = {
        Bucket: location,
        Key: filename
    };

    return request;
};

uploadToS3 = (request) => {
    return new Promise((resolve, reject) => {
        s3.putObject(request, (err, data) => {
            if (err) {
                return reject(err);
            }

            return resolve(data);
        });
    });
};

downloadFromS3 = (request) => {
    return new Promise((resolve, reject) => {
        s3.getObject(request, (err, data) => {
            if (err) {
                return reject(err);
            }

            return resolve(data);
        });
    });
};

module.exports = { createPutPublicJsonRequest, createGetPublicJsonRequest, uploadToS3, downloadFromS3 };
