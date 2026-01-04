const axios = require('axios');
const logger = require('../../shared/utils/logger');

const httpClient = axios.create({
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

httpClient.interceptors.request.use(
    (config) => {
        logger.info(`[HTTP REQUEST] ${config.method.toUpperCase()} ${config.url}`);
        return config;
    }, 
    (error) => {
        logger.error(`[HTTP REQUEST ERROR] ${error.message}`);
        return Promise.reject(error);
    }
);

httpClient.interceptors.response.use(
    (response) => {
        logger.info(`[HTTP RESPONSE] ${response.status} ${response.config.url}`);
        return response;
    }, 
    (error) => {
        if (error.response) {
            logger.error(`[HTTP RESPONSE ERROR] ${error.response.status} ${error.response.config.url}`);
        } else if (error.request) {
            logger.error(`[HTTP RESPONSE ERROR] No response received: ${error.message}`);
        } else {
            logger.error(`[HTTP RESPONSE ERROR] ${error.message}`);
        }
        return Promise.reject(error);
    }
);

module.exports = httpClient;