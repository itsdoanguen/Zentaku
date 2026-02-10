import axios from 'axios';
import { AnilistAPIError } from '../../../shared/utils/error';
import logger from '../../../shared/utils/logger';
import httpClient from '../../http/httpClient';

interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    status?: number;
    locations?: Array<{ line: number; column: number }>;
  }>;
}

interface HttpResponse<T = unknown> {
  status: number;
  data: T;
}

/**
 * Base AniList GraphQL Client
 *
 * @class AnilistClient
 */
class AnilistClient {
  protected readonly apiUrl: string;

  constructor() {
    this.apiUrl = 'https://graphql.anilist.co';
  }

  /**
   * Execute a GraphQL query against AniList API
   *
   * @param {string} query - GraphQL query string
   * @param {object} variables - Query variables
   * @param {string} operationName - Operation name for logging
   * @returns {Promise<T>} - Response data
   * @throws {AnilistAPIError} - If request fails
   *
   * @protected
   */
  protected async executeQuery<T = unknown>(
    query: string,
    variables: Record<string, unknown> = {},
    operationName: string = 'AnilistQuery'
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const response: HttpResponse<GraphQLResponse<T>> = await httpClient.post(this.apiUrl, {
        query,
        variables,
      });

      const duration = Date.now() - startTime;
      logger.info(`[AniList] ${operationName} completed in ${duration}ms`);

      if (response.data.errors) {
        logger.error(`[AniList] GraphQL errors: ${JSON.stringify(response.data.errors)}`);
        throw new AnilistAPIError('AniList API returned errors', response.status, {
          errors: response.data.errors,
        });
      }

      return response.data.data as T;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;

      if (error instanceof AnilistAPIError) {
        throw error;
      }

      if (axios.isAxiosError(error) && error.response) {
        logger.error(
          `[AniList] ${operationName} failed with status ${error.response.status} (${duration}ms)`
        );
        throw new AnilistAPIError(
          `AniList API request failed: ${error.response.status}`,
          error.response.status,
          error.response.data
        );
      }

      logger.error(
        `[AniList] ${operationName} network error after ${duration}ms:`,
        (error as Error).message
      );
      throw new AnilistAPIError(`Network error: ${(error as Error).message}`, 500);
    }
  }
}

export default AnilistClient;
