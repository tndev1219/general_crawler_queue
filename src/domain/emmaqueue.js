const mysql = require('mysql');

class EmmaQueue {

    constructor() { }

    static insertUpdateEmmaFullQueueSQL(rows) {
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
            if ((key == 'uuid') || (key == 'user_token') || (key == 'product_id') || (key == 'product_url') || (key == 'product_info_payload')) {
                arr.push(`${key}=IF(${key} is null, ${key}, values(${key}))`);
            } else if ((key == 'created_at')) {
                arr.push(`${key}=IF(isnull(${key}), values(${key}), ${key})`);
            } else {
                arr.push(`${key}=VALUES(${key})`);
            }
        });

        let update_value_str = arr.join(",");

        let insertQuery = `INSERT INTO emma_full_queue (${key_list}) VALUES ${values_str} ON DUPLICATE KEY UPDATE ${update_value_str}`;
        let query = mysql.format(insertQuery, values);

        return query;
    }

    static getEmmaFullQueueSQL(fields, condition) {
        let sql = `SELECT ${fields} FROM emma_full_queue WHERE ${condition}`;
        return sql;
    }

    static updateEmmaFullQueueSQL(fields, condition) {
        let sql = `UPDATE emma_full_queue SET ${fields} WHERE ${condition}`;
        return sql;
    }
}

module.exports = EmmaQueue;