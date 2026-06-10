/**
 * Movie Upload Service
 *
 * Handles uploading video and subtitle files to FilmServer
 * and triggering HLS conversion.
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'node:fs';
import logger from '../../../shared/utils/logger';

interface UploadEpisodeResult {
  animeId: number;
  episodeNumber: string;
  uploadSuccess: boolean;
  conversionStatus: string;
  message: string;
}

interface FilmServerEpisode {
  episodeNumber: string;
  hasHls: boolean;
  hasSubtitle: boolean;
  files: string[];
}

export class MovieUploadService {
  private readonly filmServerUrl: string;

  constructor() {
    const baseUrl = process.env.FILMSERVER_BASE_URL?.trim();
    this.filmServerUrl = baseUrl ? baseUrl.replace(/\/+$/, '') : 'http://localhost:3636';
    logger.info(`[MovieUploadService] Initialized with FilmServer URL: ${this.filmServerUrl}`);
  }

  /**
   * Upload video and subtitle files to FilmServer, then trigger HLS conversion.
   *
   * @param animeId - The AniList ID of the anime
   * @param episodeNumber - Episode number (will be zero-padded to 2 digits)
   * @param videoFilePath - Path to the uploaded video file on disk
   * @param subtitleFilePath - Optional path to the uploaded subtitle file on disk
   * @returns Upload result with conversion status
   */
  async uploadEpisode(
    animeId: number,
    episodeNumber: number,
    videoFilePath: string,
    subtitleFilePath?: string
  ): Promise<UploadEpisodeResult> {
    const epStr = String(episodeNumber).padStart(2, '0');

    logger.info(`[MovieUploadService] Starting upload for anime ${animeId} episode ${epStr}`);

    // Step 1: Upload files to FilmServer
    const formData = new FormData();
    formData.append('animeId', String(animeId));
    formData.append('episodeNumber', String(episodeNumber));

    if (videoFilePath && fs.existsSync(videoFilePath)) {
      formData.append('video', fs.createReadStream(videoFilePath));
    }

    if (subtitleFilePath && fs.existsSync(subtitleFilePath)) {
      formData.append('subtitle', fs.createReadStream(subtitleFilePath));
    }

    const uploadResponse = await axios.post(`${this.filmServerUrl}/api/upload/episode`, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 600000, // 10 minutes timeout for large files
    });

    if (!uploadResponse.data?.success) {
      throw new Error(`FilmServer upload failed: ${uploadResponse.data?.error || 'Unknown error'}`);
    }

    logger.info(
      `[MovieUploadService] Files uploaded successfully to FilmServer for anime ${animeId} ep ${epStr}`
    );

    // Step 2: Trigger HLS conversion if video was uploaded
    let conversionStatus = 'no_video';
    let conversionMessage = 'No video file to convert';

    const videoPath = uploadResponse.data.data?.videoPath;
    if (videoPath) {
      try {
        const convertResponse = await axios.post(
          `${this.filmServerUrl}/api/convert/episode`,
          {
            animeId,
            episodeNumber,
            videoPath,
          },
          { timeout: 10000 }
        );

        conversionStatus = convertResponse.data?.status || 'unknown';
        conversionMessage = convertResponse.data?.message || 'Conversion triggered';

        logger.info(`[MovieUploadService] HLS conversion triggered: ${conversionStatus}`);
      } catch (err: any) {
        logger.error(`[MovieUploadService] Failed to trigger conversion: ${err.message}`);
        conversionStatus = 'conversion_trigger_failed';
        conversionMessage = err.message;
      }
    }

    // Step 3: Clean up temp files on Zentaku_BE side
    this.cleanupTempFiles(videoFilePath, subtitleFilePath);

    return {
      animeId,
      episodeNumber: epStr,
      uploadSuccess: true,
      conversionStatus,
      message: conversionMessage,
    };
  }

  /**
   * Get list of episodes for an anime from FilmServer
   */
  async getEpisodes(animeId: number): Promise<FilmServerEpisode[]> {
    try {
      const response = await axios.get(`${this.filmServerUrl}/api/episodes/${animeId}`, {
        timeout: 5000,
      });
      return response.data?.episodes || [];
    } catch (err: any) {
      logger.error(`[MovieUploadService] Failed to fetch episodes: ${err.message}`);
      return [];
    }
  }

  /**
   * Get conversion status from FilmServer
   */
  async getConversionStatus(): Promise<Record<string, unknown>> {
    try {
      const response = await axios.get(`${this.filmServerUrl}/api/convert/status`, {
        timeout: 5000,
      });
      return response.data?.activeConversions || {};
    } catch (err: any) {
      logger.error(`[MovieUploadService] Failed to get conversion status: ${err.message}`);
      return {};
    }
  }

  /**
   * Get all movies from FilmServer
   */
  async getMovies(): Promise<Record<number, number>> {
    try {
      const response = await axios.get(`${this.filmServerUrl}/api/movies`, { timeout: 5000 });
      return response.data?.movies || {};
    } catch (err: any) {
      logger.error(`[MovieUploadService] Failed to fetch movies: ${err.message}`);
      return {};
    }
  }

  /**
   * Delete an episode from FilmServer
   */
  async deleteEpisode(animeId: number, episodeNumber: number): Promise<boolean> {
    try {
      await axios.delete(`${this.filmServerUrl}/api/movies/${animeId}/${episodeNumber}`, {
        timeout: 5000,
      });
      return true;
    } catch (err: any) {
      logger.error(`[MovieUploadService] Failed to delete episode: ${err.message}`);
      return false;
    }
  }

  private cleanupTempFiles(...filePaths: (string | undefined)[]): void {
    for (const filePath of filePaths) {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          logger.debug(`[MovieUploadService] Cleaned up temp file: ${filePath}`);
        } catch (err: any) {
          logger.warn(`[MovieUploadService] Failed to clean temp file ${filePath}: ${err.message}`);
        }
      }
    }
  }
}
