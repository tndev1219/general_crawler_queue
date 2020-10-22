class Store {

    constructor() { }

    getAddStoreSQL() {
        let sql = `INSERT INTO stores SET ?`;
        return sql;
    }

    static getStoreByFieldNameSQL(fieldName) {
        let sql = `SELECT * FROM stores WHERE ${fieldName}=?`;
        return sql;
    }

    static updateStoreByFieldNameSQL(fields, condition){
        let sql = `UPDATE stores SET ${fields} WHERE ${condition}`;
        return sql;
    }
}

module.exports = Store;
