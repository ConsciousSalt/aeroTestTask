exports.AppError = class extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4')? 'fail': 'error';
    }
}

/**
 * Set HTTP response success status (default 200) and set body as json
 * and send it back to client
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 */
exports.handle200 = (res, data, statusCode)=>{
    res.status(statusCode||200).json({
        status: 'success',
        data
    });
}

/**
 * Set HTTP response error status (default 500)
 * and set body as json from given error
 * and send it back to client
 * @param req HTTP request argument to the middleware function
 * @param res HTTP response argument to the middleware function
 */
exports.handleError = (res, err)=>{
    res.status(err.statusCode||500).json({
        status: err.status||'error',
        message: err.message||'something bad happend'
    });
}

/**
 * Removes the prefix 'bearer' from authorization 
 * and return trimmed hash jwt token
 * @param {String} header
 * @returns {String} jwt token|empty string if header value emty
 */
exports.extractBearerFromHeader = (header) => {
    let clearToken = '';
    if (!!header && header.trim().length > 0){
        const bearer = header.split(' ');
        
        if (bearer.length>1){
            clearToken = bearer[1];
        }  
    }
    
    return clearToken;
}
