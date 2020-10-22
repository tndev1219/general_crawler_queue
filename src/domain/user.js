class User {

    constructor() { }

    static getUserByFieldNameSQL(fieldName) {
        let sql = `SELECT * FROM users WHERE ${fieldName}=?`;
        return sql;
    }
}

module.exports = User;