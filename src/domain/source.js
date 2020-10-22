class Source {

    constructor() { }

    static getSourceSQL(fields, condition) {
        let sql = `SELECT ${fields} FROM sources WHERE ${condition}`;
        return sql;
    }
}

module.exports = Source;