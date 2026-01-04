/**
 * Custom Error class for handling application-specific errors.
 */

class AnilistAPIError extends Error {
    /**
     * Custom error for Anilist API related issues.
     * @param {string} message - Error message.
     * @param {number} statusCode - HTTP status code.
     * @param {object} details - Additional error details.
     */

    constructor(message, statusCode = 500, details = {}) {
        super(message);
        this.name = 'AnilistAPIError';
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true; 
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends Error {
    /**
     * Custom error for not found resources.
     * @param {string} message - Error message.
     */
    constructor(message = 'Resource Not Found') {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
        this.isOperational = true; 
        Error.captureStackTrace(this, this, this.constructor);
    }   
}

class ValidationError extends Error {
    /**
     * Custom error for validation failures.
     * @param {string} message - Error message.
     * @param {object} errors - Details about validation errors.
     */
    constructor(message = 'Validation Error', errors = {}) {    
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
        this.errors = errors;
        this.isOperational = true; 
        Error.captureStackTrace(this, this, this.constructor);
    }
}

module.exports = {
    AnilistAPIError,
    NotFoundError,
    ValidationError,
};