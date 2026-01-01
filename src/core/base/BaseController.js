const logger = require('../../shared/utils/logger');

/**
 * Abstract Base Controller Class
 * Provides common functionality for all HTTP controllers
 * 
 * Features:
 * - Standardized response formats
 * - HTTP parameter extraction helpers
 * - Async error handling wrapper
 * - Pagination support
 * - Logging capabilities
 * 
 * @abstract
 */
class BaseController {
    /**
     * @param {Object} service - The service instance this controller uses
     */
    constructor(service) {
        // Prevent direct instantiation of abstract class
        if (new.target === BaseController) {
            throw new Error('Cannot instantiate abstract class BaseController directly');
        }
        
        // Inject service dependency
        this.service = service;
        this.logger = logger;
    }
    
    // ==================== RESPONSE HELPERS ====================
    
    /**
     * Send successful response with data
     * 
     * @param {Response} res - Express response object
     * @param {*} data - Response data
     * @param {number} statusCode - HTTP status code (default: 200)
     * @returns {Response} Express response
     * 
     * @example
     * return this.success(res, { user: userData });
     * // Response: { success: true, data: { user: {...} } }
     */
    success(res, data, statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            data
        });
    }
    
    /**
     * Send created response (201)
     * 
     * @param {Response} res - Express response object
     * @param {*} data - Created resource data
     * @returns {Response} Express response
     * 
     * @example
     * return this.created(res, newUser);
     * // Response: { success: true, data: {...} } with status 201
     */
    created(res, data) {
        return this.success(res, data, 201);
    }
    
    /**
     * Send no content response (204)
     * Used for successful operations with no return data (e.g., DELETE)
     * 
     * @param {Response} res - Express response object
     * @returns {Response} Express response
     * 
     * @example
     * return this.noContent(res);
     * // Response: Empty body with status 204
     */
    noContent(res) {
        return res.status(204).send();
    }
    
    /**
     * Send paginated response with metadata
     * 
     * @param {Response} res - Express response object
     * @param {Array} items - Array of items for current page
     * @param {Object} paginationMeta - Pagination metadata
     * @param {number} paginationMeta.currentPage - Current page number
     * @param {number} paginationMeta.perPage - Items per page
     * @param {number} paginationMeta.total - Total items count
     * @param {number} paginationMeta.totalPages - Total pages count
     * @param {boolean} paginationMeta.hasNextPage - Has next page flag
     * @param {boolean} paginationMeta.hasPreviousPage - Has previous page flag
     * @param {number} paginationMeta.nextPage - Next page number
     * @param {number} paginationMeta.previousPage - Previous page number
     * @returns {Response} Express response
     * 
     * @example
     * return this.paginated(res, animes, {
     *   currentPage: 1,
     *   perPage: 20,
     *   total: 100,
     *   totalPages: 5,
     *   hasNextPage: true,
     *   hasPreviousPage: false,
     *   nextPage: 2,
     *   previousPage: null
     * });
     */
    paginated(res, items, paginationMeta) {
        return res.status(200).json({
            success: true,
            data: items,
            pagination: {
                currentPage: paginationMeta.currentPage,
                perPage: paginationMeta.perPage,
                total: paginationMeta.total,
                totalPages: paginationMeta.totalPages,
                hasNextPage: paginationMeta.hasNextPage,
                hasPreviousPage: paginationMeta.hasPreviousPage,
                nextPage: paginationMeta.nextPage,
                previousPage: paginationMeta.previousPage
            }
        });
    }
    
    /**
     * Send error response
     * 
     * @param {Response} res - Express response object
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {Object} details - Additional error details
     * @returns {Response} Express response
     * 
     * @example
     * return this.error(res, 'Not found', 404);
     */
    error(res, message, statusCode = 500, details = null) {
        const response = {
            success: false,
            error: {
                message,
                statusCode
            }
        };
        
        if (details) {
            response.error.details = details;
        }
        
        return res.status(statusCode).json(response);
    }
    
    // ==================== PARAMETER EXTRACTION HELPERS ====================
    
    /**
     * Extract and parse integer from route parameters
     * 
     * @param {Request} req - Express request object
     * @param {string} paramName - Name of the parameter
     * @returns {number} Parsed integer value
     * 
     * @example
     * // Route: /api/anime/:anilistId
     * const anilistId = this.getIntParam(req, 'anilistId');
     */
    getIntParam(req, paramName) {
        const value = req.params[paramName];
        return parseInt(value, 10);
    }
    
    /**
     * Extract and parse integer from query string
     * 
     * @param {Request} req - Express request object
     * @param {string} queryName - Name of the query parameter
     * @param {number} defaultValue - Default value if not provided
     * @returns {number} Parsed integer value or default
     * 
     * @example
     * // Request: /api/anime?page=2
     * const page = this.getIntQuery(req, 'page', 1);
     */
    getIntQuery(req, queryName, defaultValue = null) {
        const value = req.query[queryName];
        
        if (value === undefined || value === null) {
            return defaultValue;
        }
        
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }
    
    /**
     * Extract string from query parameters
     * 
     * @param {Request} req - Express request object
     * @param {string} queryName - Name of the query parameter
     * @param {string} defaultValue - Default value if not provided
     * @returns {string} Query string value or default
     * 
     * @example
     * // Request: /api/anime?season=summer
     * const query = this.getStringQuery(req, 'season', '');
     */
    getStringQuery(req, queryName, defaultValue = '') {
        const value = req.query[queryName];
        return value !== undefined && value !== null ? String(value) : defaultValue;
    }
    
    /**
     * Extract pagination parameters from query string
     * 
     * @param {Request} req - Express request object
     * @param {Object} defaults - Default pagination values
     * @param {number} defaults.page - Default page number (default: 1)
     * @param {number} defaults.perPage - Default items per page (default: 20)
     * @param {number} defaults.maxPerPage - Maximum items per page (default: 100)
     * @returns {Object} Pagination parameters { page, perPage }
     * 
     * @example
     * const { page, perPage } = this.getPaginationParams(req);
     * // Request: ?page=2&perPage=50
     * // Returns: { page: 2, perPage: 50 }
     */
    getPaginationParams(req, defaults = {}) {
        const {
            page: defaultPage = 1,
            perPage: defaultPerPage = 20,
            maxPerPage = 100
        } = defaults;
        
        let page = this.getIntQuery(req, 'page', defaultPage);
        let perPage = this.getIntQuery(req, 'perPage', defaultPerPage);
        
        // Validate and sanitize
        page = Math.max(1, page);
        perPage = Math.min(maxPerPage, Math.max(1, perPage));
        
        return { page, perPage };
    }
    
    /**
     * Extract all query parameters as object
     * 
     * @param {Request} req - Express request object
     * @returns {Object} Query parameters object
     * 
     * @example
     * // Request: /api/anime?season=summer&year=2021
     * const queryParams = this.getQueryParams(req);
     * // Returns: { season: 'summer', year: '2021' }
     */
    getQueryParams(req) {
        return { ...req.query };
    }
    
    /**
     * Extract request body
     * 
     * @param {Request} req - Express request object
     * @returns {Object} Request body
     * 
     * @example
     * // Request body: { title: 'Naruto', episodes: 220 }
     * const body = this.getBody(req);
     * // Returns: { title: 'Naruto', episodes: 220 }
     */
    getBody(req) {
        return req.body || {};
    }
    
    /**
     * Extract user from authenticated request
     * Assumes authentication middleware sets req.user
     * 
     * @param {Request} req - Express request object
     * @returns {Object|null} User object or null
     */
    getUser(req) {
        return req.user || null;
    }
    
    /**
     * Get user ID from authenticated request
     * 
     * @param {Request} req - Express request object
     * @returns {number|null} User ID or null
     */
    getUserId(req) {
        return req.user?.id || null;
    }
    
    // ==================== ERROR HANDLING ====================
    
    /**
     * Wrap async route handler to catch errors
     * Automatically passes errors to Express error handling middleware
     * 
     * @param {Function} fn - Async route handler function
     * @returns {Function} Express middleware function
     * 
     * @example
     * router.get('/anime/:id', this.asyncHandler(async (req, res) => {
     *   const anime = await this.service.getAnime(req.params.id);
     *   return this.success(res, anime);
     * }));
     */
    asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn.call(this, req, res, next))
                .catch(next);
        };
    }
    
    /**
     * Handle controller-level errors
     * Can be overridden by subclasses for custom error handling
     * 
     * @param {Error} error - Error object
     * @param {Request} req - Express request object
     * @param {NextFunction} next - Express next function
     * @protected
     */
    handleError(error, req, next) {
        this.logger.error(
            `[${this.constructor.name}] Error in ${req.method} ${req.path}`,
            {
                error: error.message,
                stack: error.stack,
                method: req.method,
                path: req.path,
                params: req.params,
                query: req.query
            }
        );
        
        // Pass to Express error handler middleware
        next(error);
    }
    
    // ==================== LOGGING HELPERS ====================
    
    /**
     * Log info message with controller context
     * 
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     * @protected
     */
    logInfo(message, meta = {}) {
        this.logger.info(`[${this.constructor.name}] ${message}`, meta);
    }
    
    /**
     * Log warning message with controller context
     * 
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     * @protected
     */
    logWarn(message, meta = {}) {
        this.logger.warn(`[${this.constructor.name}] ${message}`, meta);
    }
    
    /**
     * Log error message with controller context
     * 
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     * @protected
     */
    logError(message, meta = {}) {
        this.logger.error(`[${this.constructor.name}] ${message}`, meta);
    }
    
    /**
     * Log debug message with controller context
     * 
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     * @protected
     */
    logDebug(message, meta = {}) {
        this.logger.debug(`[${this.constructor.name}] ${message}`, meta);
    }
    
    // ==================== VALIDATION HELPERS ====================
    
    /**
     * Validate required parameters exist
     * 
     * @param {Object} params - Parameters object
     * @param {string[]} requiredFields - Array of required field names
     * @throws {ValidationError} If required fields are missing
     * @protected
     */
    validateRequired(params, requiredFields) {
        const { ValidationError } = require('../../shared/utils/error');
        const missing = [];
        
        for (const field of requiredFields) {
            if (params[field] === undefined || params[field] === null) {
                missing.push(field);
            }
        }
        
        if (missing.length > 0) {
            throw new ValidationError(
                `Missing required fields: ${missing.join(', ')}`
            );
        }
    }
    
    /**
     * Check if request has valid authentication
     * 
     * @param {Request} req - Express request object
     * @returns {boolean} True if authenticated
     */
    isAuthenticated(req) {
        return !!req.user;
    }
    
    /**
     * Require authentication, throw error if not authenticated
     * 
     * @param {Request} req - Express request object
     * @throws {Error} If not authenticated
     * @protected
     */
    requireAuth(req) {
        if (!this.isAuthenticated(req)) {
            const error = new Error('Authentication required');
            error.statusCode = 401;
            throw error;
        }
    }
}

module.exports = BaseController;
