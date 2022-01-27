const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userUtil = require('../model/user');
const appUtil = require('../model/appUtil');
const validationUtil = require('../model/validation');

/**
 * Generate new refresh token and place it to tokens array
 * Replaces the existing one, if any
 * @param  {String} id user id
 * @param  {[Object]} tokens tokens storage
 * @return {String} new token
 */
function generateRefreshToken(id, tokens) {
     const token = jwt.sign({id}, process.env.JWT_REFRESH_SECRET, {expiresIn:'1d'});
     
     const item = tokens.find(t=>t.id === id && t.type === 'refresh');
     if (!item){
        tokens.push({id, type: 'refresh', value:token});
     }else{
         item.value = token;
     }
     
     return token;
}

/**
 * Generate new access token and place it to tokens array
 * Replaces the existing one, if any
 * @param  {String} id user id
 * @param  {[Object]} tokens tokens storage
 * @return {String} new token
 */
function generateAccessToken(id, tokens) {
    const token = jwt.sign({id}, process.env.JWT_ACCESS_SECRET, {expiresIn:'10m'});
    const item = tokens.find(t=>t.id === id && t.type === 'bearer');
    if (!item){
       tokens.push({id, type: 'bearer', value:token});
    }else{
        item.value = token;
    }
    return token;
}

/**
 * Middleware.
 * Add to req object new property 'bearer' and puts the value of the authorization header in it 
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 * @function next Callback argument to the middleware function
 */
exports.getBearerFromHeader = (req, res, next) => {
    req['bearer'] = appUtil.extractBearerFromHeader(req.header('authorization'));
    next();
}

/**
 * Middleware.
 * Call validation function to check access token. 
 * If token is incorrect throws the exception
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 * @function next Callback argument to the middleware function
 */
exports.verifyAccessToken = (req, res, next) => {
    try{
        validationUtil.isValidBearerToken(req.bearer, req.app.locals.tokens);
    }catch(err){
        return appUtil.handleError(res, err);
    }

    next();
}

/**
 * Middleware.
 * Call validation function to check refresh token. 
 * If token is incorrect throws the exception
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 * @function next Callback argument to the middleware function
 */
exports.verifyRefreshToken = (req, res, next) => {
    try{
        if (!validationUtil.isValidRefreshToken(req.body.refresh, req.app.locals.tokens)) {
            
        }
    }catch(err){
        return appUtil.handleError(res, err);
    }

    next();
}

/**
 * Middleware.
 * Call validation function to check user id from request body
 * If id is incorrect throws the exception
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 * @function next Callback argument to the middleware function
 */
exports.checkUserId = (req, res, next) => {
    try {
        validationUtil.isValidUserID(req.body.id);   
    } catch (err) {
        return appUtil.handleError(res, err);
    }  
    next();
}

/**
 * Middleware.
 * Call validation function to check user id is not used
 * If id already in base throws the exception.
 * User id is passed in the request body
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 * @function next Callback argument to the middleware function
 */
exports.checkVacantID = async (req, res, next) => {
    const { pool } = req.app.locals;
    try {
        await userUtil.checkIDIsvacantOrThrowTheException(pool, req.body.id);  
    } catch (err) {
        return appUtil.handleError(res, err);
    } 
    next();
}

/**
 * Middleware.
 * Call validation function to check user password
 * If id already in base throws the exception.
 * Password is passed in the request body
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 * @function next Callback argument to the middleware function
 */
exports.checkUserPassword = (req, res, next) => {
    try {
        validationUtil.isValidUserPassword(req.body.password)
    } catch (err) {
        return appUtil.handleError(res, err);
    }
    
    next();
}

/**
 * Middleware.
 * Generates a hash for the given password and puts it in req object property 'encodedPassword'. 
 * Password is passed in the request body 
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 * @function next Callback argument to the middleware function
 */
exports.encodePassword = async (req, res, next) => {
    req['encodedPassword'] = await bcrypt.hash(req.body.password, 12);
    next();
}

/**
 * Middleware.
 * Add to req object new property "user". 
 * It's an object containing the user's id and password.
 * This information is used to write to the database
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 * @function next Callback argument to the middleware function
 */
exports.populateUserWithDBData = (req, res, next) => {
    req['user'] = {};
    req['user']['id'] = req.body.id;
    req['user']['password'] = req.encodedPassword||req.body.password;

    next();
}

/**
 * Add new user data to database. Generates a new bearer and refresh token pair
 * and send it back to client
 * if an error occurs, it will be send 
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 */
exports.signupUser = async (req, res) => {
    const { pool } = req.app.locals;
    try {
        const newUser = await userUtil.createUserOrThrowTheException(pool, req.user);
        const result = {
            refresh: generateRefreshToken(newUser.id, req.app.locals.tokens),
            bearer: generateAccessToken(newUser.id, req.app.locals.tokens) 
        };
        appUtil.handle200(res, result, 201);
    } catch (err) {
        appUtil.handleError(res, err);
    }
}

/**
 * Call user id and password validation. If credentials are correct
 * generates a new bearer and refresh token pair and send it back to client
 * if an error occurs, it will be send 
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 */
exports.signinUser = async (req, res) => {
    const { pool } = req.app.locals;
    let result;
    try {
        if (await validationUtil.checkUserCredentials(pool,  req.user.id, req.user.password)){
            result = {
                refresh: generateRefreshToken(req.user.id, req.app.locals.tokens),
                bearer: generateAccessToken(req.user.id, req.app.locals.tokens) 
            };
        }
        appUtil.handle200(res, result, 201);
    } catch (err) {
        appUtil.handleError(res, err);
    }   
}

/**
 * Check if given refresh token is in tokens storage.
 * If it's there, then a new bearer token is generated and send it back to client
 * if an error occurs, it will be send 
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 */
exports.refreshAccessToken = (req, res) => {
    const item = req.app.locals.tokens.find(t=>t.value===req.body.refresh && t.type==='refresh');
    if (!item) {
        appUtil.handleError(res, {statusCode:403,status: 'fail', message:'incorrect refresh token'});
    }

    const bearer = generateAccessToken(item.id, req.app.locals.tokens);
    appUtil.handle200(res, {bearer});
}

/**
 * Get user data by bearer token and send user id back to client 
 * if an error occurs, it will be send 
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 */
exports.getUserInfo = async (req, res) => {
    const { pool } = req.app.locals;
    try{
        const item = req.app.locals.tokens.find(t=>t.value===req.bearer && t.type==='bearer');
        if (!item) {
            appUtil.handleError(res, {statusCode:403,status: 'fail', message:'incorrect bearer token'});   
        }
        const user = await userUtil.getUserInfoByIdOrThrowTheException(pool, item.id);
        appUtil.handle200(res, {id:  user.id});
    }catch (err) {
        appUtil.handleError(res, err);    
    }
}

/**
 * Delete both refresh and bearer token from token storage.
 * if an error occurs, it will be send 
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 */
exports.logoutUser = async (req, res) => {
    const item = req.app.locals.tokens.find(t=>t.value === req.bearer && t.type==='bearer');
    if (!item) {
        appUtil.handleError(res, {statusCode:403,status: 'fail', message:'incorrect bearer token'});   
    }
    const refreshItem = req.app.locals.tokens.find(t=>t.id === item.id && t.type==='refresh'); 
    let refresh = '';
    if (refreshItem){
        refresh = refreshItem.value;    
    }
    req.app.locals.tokens = req.app.locals.tokens.filter(t=>t.value !== req.bearer && t.value !== refresh);
    appUtil.handle200(res);
}