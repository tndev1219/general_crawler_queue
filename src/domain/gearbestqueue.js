const mysql = require('mysql');

class GearbestQueue {

    constructor() { }

    static insertUpdateGearbestFullQueueSQL(rows) {
        const values = [];
        var key_list = [];

        Object.keys(rows[0]).forEach(key => {
            key_list.push(key);
        });

        let arr = [];
        rows.forEach(item => {
            let t_arr = [];
            key_list.forEach(key => {
                t_arr.push('?');
                values.push(item[key]);
            });

            arr.push(`( ${t_arr.join(',')})`);
        });

        let values_str = arr.join(",");
        arr = [];

        key_list.forEach(key => {
            if ((key == 'uuid') || (key == 'user_token') || (key == 'goodsSn') || (key == 'language') || (key == 'product_url') || (key == 'product_info_payload')) {
                arr.push(`${key}=IF(${key} is null, ${key}, values(${key}))`);
            } else if ((key == 'created_at')) {
                arr.push(`${key}=IF(isnull(${key}), values(${key}), ${key})`);
            } else {
                arr.push(`${key}=VALUES(${key})`);
            }
        });

        let update_value_str = arr.join(",");

        let insertQuery = `INSERT INTO gearbest_full_queue (${key_list}) VALUES ${values_str} ON DUPLICATE KEY UPDATE ${update_value_str}`;
        let query = mysql.format(insertQuery, values);

        return query;
    }

    static getGearbestFullQueueSQL(fields, condition) {
        let sql = `SELECT ${fields} FROM gearbest_full_queue WHERE ${condition}`;
        return sql;
    }

    static updateGearbestFullQueueSQL(fields, condition) {
        let sql = `UPDATE gearbest_full_queue SET ${fields} WHERE ${condition}`;
        return sql;
    }

    static insertUpdateGearbestStockQueueSQL(rows) {
        const values = [];
        var key_list = [];

        Object.keys(rows[0]).forEach(key => {
            key_list.push(key);
        });

        let arr = [];
        rows.forEach(item => {
            let t_arr = [];
            key_list.forEach(key => {
                t_arr.push('?');
                values.push(item[key]);
            });

            arr.push(`( ${t_arr.join(',')})`);
        });

        let values_str = arr.join(",");
        arr = [];

        key_list.forEach(key => {
            if ((key == 'uuid') || (key == 'user_token') || (key == 'goodsSn') || (key == 'product_url') || (key == 'product_info_payload')) {
                arr.push(`${key}=IF(${key} is null, ${key}, values(${key}))`);
            } else if ((key == 'created_at')) {
                arr.push(`${key}=IF(isnull(${key}), values(${key}), ${key})`);
            } else {
                arr.push(`${key}=VALUES(${key})`);
            }
        });

        let update_value_str = arr.join(",");

        let insertQuery = `INSERT INTO gearbest_stock_queue (${key_list}) VALUES ${values_str} ON DUPLICATE KEY UPDATE ${update_value_str}`;
        let query = mysql.format(insertQuery, values);

        return query;
    }

    static getGearbestStockQueueSQL(fields, condition) {
        let sql = `SELECT ${fields} FROM gearbest_stock_queue WHERE ${condition}`;
        return sql;
    }

    static updateGearbestStockQueueSQL(fields, condition) {
        let sql = `UPDATE gearbest_stock_queue SET ${fields} WHERE ${condition}`;
        return sql;
    }
}

module.exports = GearbestQueue;