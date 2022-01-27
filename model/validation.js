const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const {AppError} = require('./appUtil');
const userUtil = require('./user');

/**
 * Compare password sended by client with hashed password from database  
 * if don't match throws an error
 * @param {String} reqPassword password sended by client in request
 * @param {String} storedPassword hashed password from fetched user data
 * @returns {Boolean} true if passord passed all checks
 */
async function confirmUserPassword(reqPassword, storedPassword) {
    let verification = false;
    let message = '';
    
    try {
        verification = await bcrypt.compare(reqPassword, storedPassword);
    }catch (err) {
        message = err.message;      
    }
    
    if (!verification || !!message) {
        throw new AppError(message||'password incorrect', 403);
    }

    return true;
};

/**
 * Check is given file id is present and it is finite number
 * if not throws an error
 * @param {Number} id file id 
 * @returns {Boolean} true
 */
exports.isValidFileID = (id)=>{
    
    if (!id) {
        throw new AppError('"id" param is required', 405);
    }

    if (isNaN(parseFloat(id)) && !isFinite(id)) {
        throw new AppError('expected id of number type', 405);        
    }

    return true;
}

/**
 * Check is given ueser id is present 
 * and it is mobile phone number (only numbers) or email
 * if not throws an error
 * @param {Number} id user id 
 * @returns {Boolean} true
 */
exports.isValidUserID = (id) =>{
    if (!id) {
        throw new AppError('"id" param is required', 405);
    }

    if (!(!validator.matches(id, /\D/) && validator.isLength(id, {min:7,max:15})) && !validator.isEmail(id)){
        throw new AppError('id expected as phone number or email', 405);   
    }

    return true;
}

/**
 * Check is given iueser password is present 
 * and it is string with length between 4 and 10 characters long
 * if it is not throws an error
 * @param {Number} id 
 * @returns {Boolean} true
 */
exports.isValidUserPassword = (password) => {
    if (!validator.isLength(!!password?password.trim():'', {min:4,max:10})) {
        throw new AppError('password expected as string between 4 and 10 characters long', 405);        
    }

    return true;
}

/**
 * Check is given access token is present, stored in token storage, 
 * it is valid JWT token, it's not expire and correctly signed ,etc...
 * if it is not throws an error
 * @param {String} token JWT string
 * @param {[String]} tokens local tokens storage
 * @returns {Boolean} true
 */
exports.isValidBearerToken = (token, tokens) => {

    const item = tokens.find(t=>t.value===token && t.type==='bearer');
    if (!item) {
        throw new AppError('invalid authorization token', 403);
    }

    if (!validator.isJWT(token)) {
        throw new AppError('invalid authorization token', 403);
    }

    let verification = false;
    let message = '';
    try {
        verification = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    } catch (err) {
        message = err.message;
    }

    if (!verification || !!message) {
        req.app.locals.tokens = req.app.locals.tokens.filter(t=>t.value!==token);
        throw new AppError(message||'token incorrect', 403);
    }

    return true;
}

/**
 * Check is given refresh token is present, stored in token storage, 
 * it is valid JWT token, it's not expire and correctly signed ,etc...
 * if it is not throws an error
 * @param {String} token JWT string
 * @param {[String]} tokens local tokens storage
 * @returns {Boolean} true
 */
exports.isValidRefreshToken = (token, tokens) => {

    const item = tokens.find(t=>t.value===token && t.type==='refresh');
    if (!item) {
        throw new AppError('invalid refresh token', 403);
    }

    if (!validator.isJWT(token)) {
        throw new AppError('invalid refresh token', 403);
    }

    let verification = false;
    let message = '';
    try {
        verification = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
        message = err.message;
    }

    if (!verification || !!message) {
        tokens = tokens.filter(t=>t.value!==token);
        throw new AppError(message||'token incorrect', 403);
    }

    return true;
}

/**
 * Check is user id and password is correct
 * if it is not throws an error
 * @param {String} candidateID user id
 * @param {String} candidatePassword user password
 * @returns {Boolean} true
 */
exports.checkUserCredentials = async (pool, candidateID, candidatePassword) => {
    let isValid = false;

    try {
        const user = await userUtil.getUserInfoByIdOrThrowTheException(pool, candidateID);
        isValid = await confirmUserPassword(candidatePassword, user.password);
    } catch (err) {
        throw new AppError('incorrect id or password', 403);
    }

    return isValid;
}