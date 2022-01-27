const appUtil = require('../model/appUtil');
const fileUtil = require('../model/file');
const validationUtil = require('../model/validation');

/**
 * Add new file description to database and place file to system.
 * Send file object back to client:
 * if an error occurs, it will be send 
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 * @example
 * {
 *  id: 17,
 *  name: 'image_2022_01_17T12_27_23_843Z.png',
 *  extention: 'png',
 *  mimetype: 'image/png',
 *  size: 234023,
 *  uploaded: '2022-01-24 19:44:22',
 *  path: 'upload\510157b61aeb894a41235f3f6c1f5763'
 * }
 */
exports.uploadFile = async (req, res) => {
    const { pool } = req.app.locals;
    try{
        const result = await fileUtil.uploadFileOrThrowTheException(pool, req.file);
        appUtil.handle200(res, result, 201);
    }catch(err){
        appUtil.handleError(res, err);
    }
}

/**
 * Find file description in database by id
 * Send file object back to client:
 * if an error occurs, it will be send 
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 * @example
 * {
 *  id: 17,
 *  name: 'image_2022_01_17T12_27_23_843Z.png',
 *  extention: 'png',
 *  mimetype: 'image/png',
 *  size: 234023,
 *  uploaded: '2022-01-24 19:44:22',
 *  path: 'upload\510157b61aeb894a41235f3f6c1f5763'
 * }
 */
exports.getFileinfo = async (req, res) => {
    const { pool } = req.app.locals;
    try{
        appUtil.handle200(res, await fileUtil.getFileInfoByIdOrThrowTheException(pool, req.params.id));
    }catch(err){
        appUtil.handleError(res, err);
    }
}

/**
 * Find file description in database by id and delete it.
 * If deletion from database is successful, deletes the file from the file system
 * Send deletion result back to client
 * if an error occurs, it will be send 
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 */
exports.deleteFile = async (req, res) => {
    const { pool } = req.app.locals;
    try{
        appUtil.handle200(res, await fileUtil.deleteFileByIdOrThrowTheException(pool, req.params.id));
    }catch(err){
        appUtil.handleError(res, err);
    }
}

/**
 * Find file description in database by id overwrite it by new data
 * Delete old file from filesystem and place new one
 * Send file object back to client:
 * if an error occurs, it will be send 
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 * @example
 * {
 *  id: 17,
 *  name: 'image_2022_01_17T12_27_23_843Z.png',
 *  extention: 'png',
 *  mimetype: 'image/png',
 *  size: 234023,
 *  uploaded: '2022-01-24 19:44:22',
 *  path: 'upload\510157b61aeb894a41235f3f6c1f5763'
 * }
 */
exports.updateFile = async (req, res) => {
    const { pool } = req.app.locals;
    try {
        const result = await fileUtil.updateFileByIdOrThrowTheException(pool, req.params.id, req.file);
        appUtil.handle200(res, result);
    } catch (err) {
        appUtil.handleError(res, err);
    }
}

/**
 * Find file by id in database and call response send file method
 * if an error occurs, it will be send 
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 */
exports.downloadFile = async (req, res) => {
    const { pool } = req.app.locals;
    try{
        const result = await fileUtil.sendFileOrThrowTheException(pool, req.params.id);
        var options = {
            root: result.root,
            dotfiles: 'deny',
            headers: {
              'x-timestamp': Date.now(),
              'x-sent': true,
              'Content-Disposition': 'attachment; filename=' + result.filename
            }
          }          
        res.sendFile(result.path, options);
    }catch(err){
        appUtil.handleError(res, err);
    }    
}

/**
 * Send back to client array of file objecs.
 * Limit by 'list_size' and offset by 'page' query value
 * Default values 'list_size': 10; 'page': 1 
 * if an error occurs, it will be send 
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 */
exports.getFilesList = async (req, res) => {
    const { pool } = req.app.locals;
    try{
        appUtil.handle200(res, await fileUtil.getFilesListOrThrowTheException(pool, req.query['list_size'], req.query['page']));
    }catch(err){
        appUtil.handleError(res, err);
    }
}

/**
 * Middleware.
 * Call validation function to check is requst has valid file id
 * If id incorrect throws an error
 * if an error occurs, it will be send 
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 */
exports.checkID = (req, res, next) => {
    try {
        validationUtil.isValidFileID(req.params.id)
    } catch (err) {
        appUtil.handleError(res, err);
    }

    next();
}

/**
 * Middleware.
 * Add to req.file object new property "db_data". 
 * It's an object containing the new files's properties.
 * This information is used to write to the database
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 * @function next Callback argument to the middleware function
 */
exports.populateFileWithDBData = (req, res, next) => {
    req.file['db_data'] = {};
    req.file['db_data']['name'] = req.file.originalname;
    const nameParts = req.file.originalname.split('.');
    req.file['db_data']['extension'] = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    req.file['db_data']['mimetype'] = req.file.mimetype;
    req.file['db_data']['size'] = req.file.size;
    req.file['db_data']['uploaded'] = { toSqlString: function () { return 'CURRENT_TIMESTAMP()'; } };
    req.file['db_data']['path'] = req.file.path;
    next();
}