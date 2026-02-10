/**
 * HTTP Client
 *
 * Configured Axios instance for making HTTP requests to external APIs.
 * This client provides centralized HTTP communication with built-in logging,
 * error handling, and request/response interceptors.
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import logger from '../../shared/utils/logger';

const httpClient: AxiosInstance = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    logger.info(`[HTTP REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    logger.error(`[HTTP REQUEST ERROR] ${error.message}`);
    return Promise.reject(error);
  }
);

httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    logger.info(`[HTTP RESPONSE] ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
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

export default httpClient;
