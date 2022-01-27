const {AppError} = require('./appUtil');

/**
 * Find user data by id.
 * if no data fetched throws an error
 * @param {Object} pool database connection pool
 * @param {String} id user id
 * @returns {Object} user info
 */
async function getUserInfoByIdOrThrowTheException(pool, id) {
    const connection = pool.promise();
    const [rows] = await connection.query('SELECT * FROM users WHERE id=?', [id]);

    if (!rows.length) {
        throw new AppError(`user with id ${id} not found`, 404);
    }

    return rows[0];
}

/**
 * Add new user info to database
 * @param {Object} pool database connection pool
 * @param {Object} user user data needed to insert to db
 * @returns {Object} file info
 */
async function createUserOrThrowTheException(pool, user) {
    const connection = pool.promise();
    const [results] = await connection.query('INSERT INTO users SET ?', user);
    return await getUserInfoByIdOrThrowTheException(pool, results.insertId);
}

/**
 * Find user id in database
 * if any data fetched throws an error
 * @param {Object} pool database connection pool
 * @param {String} id user id
 * @returns {Object} user info
 */
async function checkIDIsvacantOrThrowTheException(pool, id) {
    const connection = pool.promise();
    const [rows] = await connection.query('SELECT * FROM users WHERE id=? LIMIT 1', [id]);
    
    if (rows.length) {
        throw new AppError(`id ${id} already used`, 404);   
    }
    return true;    
}


exports.getUserInfoByIdOrThrowTheException = getUserInfoByIdOrThrowTheException;
exports.createUserOrThrowTheException = createUserOrThrowTheException;
exports.checkIDIsvacantOrThrowTheException = checkIDIsvacantOrThrowTheException;