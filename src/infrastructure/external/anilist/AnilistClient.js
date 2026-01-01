const httpClient = require('../../http/httpClient');
const logger = require('../../../shared/utils/logger');
const { AnilistAPIError } = require('../../../shared/utils/error');

/**
 * Base AniList GraphQL Client
 * Provides shared GraphQL execution functionality for all AniList clients
 * 
 * @class AnilistClient
 */
class AnilistClient {
    constructor() {
        this.apiUrl = 'https://graphql.anilist.co';
    }

    /**
     * Execute a GraphQL query against AniList API
     * 
     * @param {string} query - GraphQL query string
     * @param {object} variables - Query variables
     * @param {string} operationName - Operation name for logging
     * @returns {Promise<object>} - Response data
     * @throws {AnilistAPIError} - If request fails
     * 
     * @protected
     */
    async executeQuery(query, variables = {}, operationName = 'AnilistQuery') {
        const startTime = Date.now();

        try {
            const response = await httpClient.post(this.apiUrl, {
                query,
                variables
            });

            const duration = Date.now() - startTime;
            logger.info(`[AniList] ${operationName} completed in ${duration}ms`);

            if (response.data.errors) {
                logger.error(`[AniList] GraphQL errors: ${JSON.stringify(response.data.errors)}`);
                throw new AnilistAPIError(
                    'AniList API returned errors',
                    response.status,
                    response.data.errors
                );
            }

            return response.data.data;
        } catch (error) {
            const duration = Date.now() - startTime;

            if (error instanceof AnilistAPIError) {
                throw error;
            }

            if (error.response) {
                logger.error(`[AniList] ${operationName} failed with status ${error.response.status} (${duration}ms)`);
                throw new AnilistAPIError(
                    `AniList API request failed: ${error.response.status}`,
                    error.response.status,
                    error.response.data
                );
            }

            logger.error(`[AniList] ${operationName} network error after ${duration}ms:`, error.message);
            throw new AnilistAPIError(`Network error: ${error.message}`, 500, null);
        }
    }

}
module.exports = AnilistClient