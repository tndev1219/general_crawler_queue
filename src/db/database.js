var mysql = require('mysql');
require('dotenv').config();

const pool = mysql.createPool({
    connectionLimit: parseInt(process.env.DB_POOL_SIZE),
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_USER_PASSWORD,
    database: process.env.MYSQL_DATABASE_NAME,
    debug: false
});

const executeQuery = (sql, params, callback) => {
    pool.getConnection((err, connection) => {
        if (err) {
            // console.log('--------------databese.js: 16--------------', err.message);
            return callback(err, null);
        } else {
            if (connection) {
                connection.query(sql, params, function (error, results, fields) {
                    connection.release();
                    if (error) {
                        return callback(error, null);
                    }
                    return callback(null, results);
                });
            }
        }
    });
};

const query = (sql, params, callback) => {
    executeQuery(sql, params, function (err, data) {
        if (err) {
            console.log('Query error', err)
            console.log('SQL '+sql, params)
            // console.log('--------------databese.js: 35--------------', err.message);
            return callback(err, null);
        }
        callback(null, data);
    });
};

module.exports = {
    query
};
