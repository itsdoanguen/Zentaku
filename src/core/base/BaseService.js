const logger = require('../../shared/utils/logger');

/**
 * Abstract base service class providing common functionality for all services.
 * Features:
 * - Shared logging capabilities
 * - Common validation methods
 * - Error handling utilities
 * - Pagination support
 * @abstract
 */
class BaseService {
    constructor() {
        if (new.target === BaseService) {
            throw new TypeError('Cannot construct BaseService instances directly');
        }

        this.logger = logger;
    }

    // =================================================
    // Validation Methods
    // =================================================

    /**
     * Validates that the provided ID is a positive integer.
     * @param {number} id - The ID to validate.
     * @param {string} fieldName - The name of the field being validated (for error messages).
     * @return {number} The validated positive integer ID.
     * @throws {Error} Throws an error if the ID is not a positive integer.
     * @protected
     */
    _validateId(id, fieldName = 'ID') {
        const { ValidationError } = require('../../shared/utils/error');

        if (id === null || id === undefined) {
            throw new ValidationError(`${fieldName} is required.`);
        }

        const numericId = Number(id);
        
        if (!Number.isInteger(numericId)) {
            throw new ValidationError(`${fieldName} must be an integer`);
        }
        
        if (numericId <= 0) {
            throw new ValidationError(`${fieldName} must be a positive integer`);
        }
        
        return numericId;
    }

    /**
     * Validate that a string is not empty.
     * @param {string} str - The string to validate.
     * @param {string} fieldName - The name of the field being validated (for error messages).
     * @param {Object} options - Additional options.
     * @param {number} options.minLength - Minimum length of the string.
     * @param {number} options.maxLength - Maximum length of the string.
     * @return {string} The validated string.
     * @throws {Error} Throws an error if the string is invalid.
     * @protected
     */
    _validateString(str, fieldName = 'String', options = {}) {
        const { ValidationError } = require('../../shared/utils/error');
        const { minLength = 1, maxLength = Infinity } = options;
        
        if (str === null || str === undefined) {
            throw new ValidationError(`${fieldName} is required.`);
        }

        if (typeof str !== 'string') {
            throw new ValidationError(`${fieldName} must be a string.`);
        }

        const trimmedStr = str.trim();

        if (trimmedStr.length < minLength) {
            throw new ValidationError(`${fieldName} must be at least ${minLength} characters long.`);
        }

        if (trimmedStr.length > maxLength) {
            throw new ValidationError(`${fieldName} must be at most ${maxLength} characters long.`);
        }

        return trimmedStr;
    }

    /**
     * Validate that a value is in allowed list
     * @param {*} value - The value to validate.
     * @param {Array} allowedValues - List of allowed values.
     * @param {string} fieldName - The name of the field being validated (for error messages).
     * @return {*} The validated value.
     * @throws {Error} Throws an error if the value is not allowed.
     * @protected
     */
    _validateEnum(value, allowedValues, fieldName = 'Value') {
        const { ValidationError } = require('../../shared/utils/error');   
        
        if (!allowedValues.includes(value)) {
            throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
        }

        return value;
    }

    // =================================================
    // Pagination Support
    // =================================================

    /**
     * Calculates pagination parameters.
     * @param {number} page - Current page number (1-based).
     * @param {number} pageSize - Number of items per page.
     * @return {Object} Pagination parameters including limit and offset.
     * @protected
     */
    _getPaginationParams(page = 1, pageSize = 20) {
        const validatePage = Math.max(1, parseInt(page, 10) || 1);
        const validatePageSize = Math.max(1, parseInt(pageSize, 10) || 20);
        const validatePerPage = Math.min(100, validatePageSize);

        return {
            skip: (validatePage - 1) * validatePerPage,
            take: validatePerPage,
            page: validatePage,
            pageSize: validatePerPage,
        };
    }

    /**
     * Calculates total pages from count
     * @param {number} totalCount - Total number of items.
     * @param {number} pageSize - Number of items per page.
     * @return {number} Total number of pages.
     * @protected
     */
    _getTotalPages(totalCount, pageSize) {
        return Math.ceil(totalCount / pageSize);
    }

     /**
     * Build pagination metadata for response
     * @param {number} page - Current page
     * @param {number} perPage - Items per page
     * @param {number} total - Total items
     * @returns {Object} Pagination metadata
     * @protected
     */
    _buildPaginationMeta(page, perPage, total) {
        const totalPages = this._getTotalPages(total, perPage);
        
        return {
            currentPage: page,
            perPage: perPage,
            total: total,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            nextPage: page < totalPages ? page + 1 : null,
            previousPage: page > 1 ? page - 1 : null
        };
    }

    // =================================================
    // Error Handling Utilities
    // =================================================

    /**
     * Handle and standardize errors
     * @param {Error} error - The error to handle
     * @param {string} context - Context where error occurred
     * @throws {Error} Re-throws the error after logging
     * @protected
     */
    _handleError(error, context = '') {
        const errorContext = context ? `[${this.constructor.name}] ${context}` : `[${this.constructor.name}]`;
        
        this.logger.error(`${errorContext}: ${error.message}`, {
            stack: error.stack,
            name: error.name
        });
        
        const { NotFoundError, ValidationError, AnilistAPIError } = require('../../shared/utils/error');
        
        // Re-throw known errors without modification
        if (error instanceof NotFoundError || 
            error instanceof ValidationError || 
            error instanceof AnilistAPIError) {
            throw error;
        }
        
        // Wrap unknown errors
        throw new Error(`Service error: ${error.message}`);
    }
    
    /**
     * Safely execute an async operation with error handling
     * @param {Function} operation - Async function to execute
     * @param {string} context - Context for error messages
     * @returns {Promise<*>} Result of the operation
     * @protected
     */
    async _executeWithErrorHandling(operation, context) {
        try {
            return await operation();
        } catch (error) {
            this._handleError(error, context);
        }
    }

    // =================================================
    // LOGGING UTILITIES
    // =================================================

    /**
     * Log info message with service context
     * @param {string} message - Message to log
     * @param {Object} meta - Additional metadata
     * @protected
     */
    _logInfo(message, meta = {}) {
        this.logger.info(`[${this.constructor.name}] ${message}`, meta);
    }
    
    /**
     * Log warning message with service context
     * @param {string} message - Message to log
     * @param {Object} meta - Additional metadata
     * @protected
     */
    _logWarn(message, meta = {}) {
        this.logger.warn(`[${this.constructor.name}] ${message}`, meta);
    }
    
    /**
     * Log error message with service context
     * @param {string} message - Message to log
     * @param {Object} meta - Additional metadata
     * @protected
     */
    _logError(message, meta = {}) {
        this.logger.error(`[${this.constructor.name}] ${message}`, meta);
    }
    
    /**
     * Log debug message with service context
     * @param {string} message - Message to log
     * @param {Object} meta - Additional metadata
     * @protected
     */
    _logDebug(message, meta = {}) {
        this.logger.debug(`[${this.constructor.name}] ${message}`, meta);
    }

    // =================================================
    // Additional Common Utilities
    // =================================================

     /**
     * Check if value exists (not null/undefined)
     * @param {*} value - Value to check
     * @returns {boolean}
     * @protected
     */
    _exists(value) {
        return value !== null && value !== undefined;
    }
    
    /**
     * Check if string is empty or whitespace
     * @param {string} str - String to check
     * @returns {boolean}
     * @protected
     */
    _isEmpty(str) {
        return !str || str.trim().length === 0;
    }
    
    /**
     * Safely parse JSON
     * @param {string} jsonString - JSON string to parse
     * @param {*} defaultValue - Default value if parsing fails
     * @returns {*} Parsed object or default value
     * @protected
     */
    _parseJSON(jsonString, defaultValue = null) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            this._logWarn(`Failed to parse JSON: ${error.message}`);
            return defaultValue;
        }
    }
    
    /**
     * Sleep/delay execution
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     * @protected
     */
    async _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Retry an async operation with exponential backoff
     * @param {Function} operation - Async operation to retry
     * @param {number} maxRetries - Maximum number of retries
     * @param {number} baseDelay - Base delay in ms (doubles each retry)
     * @returns {Promise<*>}
     * @protected
     */
    async _retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
                    this._logWarn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
                    await this._sleep(delay);
                } else {
                    this._logError(`All ${maxRetries} attempts failed`);
                }
            }
        }
        
        throw lastError;
    }

    // =================================================
    // DATE/TIME HELPER METHODS
    // =================================================

    /**
     * Calculate days between two dates
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {number} Number of days
     * @protected
     */
    _daysBetween(date1, date2) {
        const diffTime = Math.abs(date2 - date1);
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Check if date is older than specified days
     * @param {Date} date - Date to check
     * @param {number} days - Number of days
     * @returns {boolean}
     * @protected
     */
    _isOlderThan(date, days) {
        if (!date) return true;
        const daysDiff = this._daysBetween(new Date(date), new Date());
        return daysDiff >= days;
    }
}

module.exports = BaseService;