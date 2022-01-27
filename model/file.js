const fs = require('fs');
const util = require('util');
const path = require('path');
const {AppError} = require('./appUtil');

const unlink = util.promisify(fs.unlink);

/**
 * Send query to db to find file info by id.
 * if no data fetched throws an error
 * @param {Object} pool database connection pool
 * @param {Number} id file id
 * @returns {Object} file info
 */
async function getFileInfoByIdOrThrowTheException(pool, id) {
    const connection = pool.promise();
    const [rows] = await connection.query('SELECT * FROM files WHERE id=?', [Number(id)]);

    if (!rows.length) {
        throw new AppError(`file by id ${id} not found`, 404);
    }

    return rows[0];
}

function calculateOffset(recordsPerPage, pageNum) {
    return Number(recordsPerPage || 0) * Number(pageNum || 0);
}

/**
 * Send query to db to get list of file info
 * set is limited by 'recordsPerPage' param
 * @param {Object} pool database connection pool
 * @param {Number} recordsPerPage limit (default 10)
 * @param {Number} pageNum used to calculate offset (default 1)
 * @returns {[Object]} file info array
 */
async function getFilesListOrThrowTheException(pool, recordsPerPage=10, pageNum=1){
    const connection = pool.promise();
    const offset = calculateOffset(recordsPerPage, pageNum-1);
    const [result] = await connection.query('SELECT * FROM files ORDER BY id ASC LIMIT ? OFFSET ?', [Number(recordsPerPage), Number(offset)]);
    return result;   
}

/**
 * Fetch file location in file system
 * @param {Object} pool database connection pool
 * @param {Number} id file id
 * @param {Number} pageNum used to calculate offset (default 1)
 * @returns {Object} file download info
 * @example
 * {
 *  root: '/absolute/path/to/file/directory',
 *  path: 'asdada32185afa3sd54asd3as34',
 *  filename: 'somefile.odt'
 * }
 */
async function sendFileOrThrowTheException(pool, id) {
    const file = await getFileInfoByIdOrThrowTheException(pool, id);
    const filePath = path.join(__dirname, '..', file.path);
    return {root: path.dirname(filePath), path: path.basename(filePath), filename:file.name};
}

/**
 * Add new file info to database
 * @param {Object} pool database connection pool
 * @param {Object} file file data needed to insert to db
 * @returns {Object} file info
 */
async function uploadFileOrThrowTheException(pool, file) {
    const connection = pool.promise();
    const [results] = await connection.query('INSERT INTO files SET ?', file.db_data);
    return await getFileInfoByIdOrThrowTheException(pool, results.insertId);
}

/**
 * Delete file info from database.
 * if deletion was successful removes file from file system
 * @param {Object} pool database connection pool
 * @param {Number} id file id
 * @returns {Object} object containing deletion info
 */
async function deleteFileByIdOrThrowTheException(pool, id) {
    const connection = pool.promise();

    const [result] = await connection.query('SELECT path FROM files WHERE id=?', [Number(id)]);
    const filePath = path.join(__dirname, '..', result.length?result[0].path:'');
    const [resultSet] = await connection.query('DELETE FROM files WHERE id=?', [Number(id)]);
    const deletedRows = resultSet.affectedRows;
    if (deletedRows > 0) {
        if (fs.existsSync(filePath)) {
            await unlink(filePath);
        }
    }
    return { deletedRows };
}

/**
 * Set new file info to database for specified id.
 * if update was successful removes previous file from file system
 * @param {Object} pool database connection pool
 * @param {Number} id file id
 * @returns {Object} file info
 */
async function updateFileByIdOrThrowTheException(pool, id, file) {
    const connection = pool.promise();
    const oldVersion = await getFileInfoByIdOrThrowTheException(pool, id);
    const oldFilePath = path.join(__dirname, '..', oldVersion.path);
    const [resultSet] = await connection.query('UPDATE files SET ? WHERE id = ?', [file.db_data, Number(id)]);
    if (resultSet.changedRows > 0) {
        if (fs.existsSync(oldFilePath)) {
            await unlink(oldFilePath);
        }        
        return await getFileInfoByIdOrThrowTheException(pool, id);
    }
}


exports.getFileInfoByIdOrThrowTheException = getFileInfoByIdOrThrowTheException;
exports.uploadFileOrThrowTheException = uploadFileOrThrowTheException;
exports.deleteFileByIdOrThrowTheException = deleteFileByIdOrThrowTheException; 
exports.updateFileByIdOrThrowTheException = updateFileByIdOrThrowTheException;
exports.sendFileOrThrowTheException = sendFileOrThrowTheException;
exports.getFilesListOrThrowTheException = getFilesListOrThrowTheException;