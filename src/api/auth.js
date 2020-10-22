const db = require('../db/database');
const User = require('../domain/user');

const authCheck = (req, res, next) => {
    if (req.headers.authorization) {
        var token = req.headers.authorization.split(' ')[1];
        db.query(User.getUserByFieldNameSQL('api_token'), [token], (err, data) => {
            if (err) {
                return res.status(401).json({
                    message: err.message
                });
            } else {
                if (data && data.length > 0) {
                    next();
                } else {
                    return res.status(401).json({
                        message: 'Authontication failed!'
                    });
                }
            }
        });
    } else {
        return res.status(401).json({
            message: 'Authontication failed!'
        });
    }
};

module.exports = { authCheck };
