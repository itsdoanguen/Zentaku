/**
 * Schedule Cron Service
 *
 * Runs periodically to check for upcoming anime episodes and sends
 * notifications to users who are watching those anime.
 *
 * The notification timing (e.g., 1 hour before) is currently a server-level
 * default but designed to be per-user configurable in the future.
 */

import logger from '../../shared/utils/logger';
import { NotificationType, LibraryStatus } from '../../entities/types/enums';
import type { NotificationService } from '../notification/services/notification.service';

/**
 * Default notification lead time in seconds (1 hour = 3600).
 * In a future phase, this will be configurable per user via their notification settings.
 */
const DEFAULT_NOTIFY_BEFORE_SECONDS = 3600;

/**
 * Polling interval in milliseconds (5 minutes).
 */
const POLL_INTERVAL_MS = 5 * 60 * 1000;

export class ScheduleCronService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  /**
   * Cache of sent notifications to avoid duplicates.
   * Key format: `{userId}:{animeId}:{episodeNumber}`
   */
  private sentCache: Set<string> = new Set();
  /** Timestamp of last cache cleanup */
  private lastCacheCleanup: number = Date.now();

  constructor(
    private readonly notificationService: NotificationService,
    private readonly anilistScheduleClient: any,
    private readonly libraryEntryRepository: any
  ) {}

  /**
   * Start the cron polling loop.
   */
  start(): void {
    if (this.intervalId) {
      logger.warn('[ScheduleCron] Already running, skipping start.');
      return;
    }

    logger.info(
      `[ScheduleCron] Starting anime airing notification cron (interval: ${POLL_INTERVAL_MS / 1000}s, lead time: ${DEFAULT_NOTIFY_BEFORE_SECONDS}s)`
    );

    // Run immediately on start, then at interval
    this.check().catch((err) =>
      logger.error(`[ScheduleCron] Initial check failed: ${err.message}`)
    );

    this.intervalId = setInterval(() => {
      this.check().catch((err) =>
        logger.error(`[ScheduleCron] Periodic check failed: ${err.message}`)
      );
    }, POLL_INTERVAL_MS);
  }

  /**
   * Stop the cron polling loop.
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('[ScheduleCron] Stopped.');
    }
  }

  /**
   * Main check routine: find anime airing within the notification window
   * and send notifications to users watching them.
   */
  private async check(): Promise<void> {
    try {
      // Clean up stale cache entries every hour
      const now = Date.now();
      if (now - this.lastCacheCleanup > 3600 * 1000) {
        this.sentCache.clear();
        this.lastCacheCleanup = now;
        logger.debug('[ScheduleCron] Cleared notification sent cache.');
      }

      const nowUnix = Math.floor(now / 1000);
      const windowEnd = nowUnix + DEFAULT_NOTIFY_BEFORE_SECONDS;

      // 1. Get all users with WATCHING library entries
      const watchingEntries = await this.libraryEntryRepository.findMany({
        where: { status: LibraryStatus.WATCHING },
        relations: ['media', 'user'],
        take: 1000,
      });

      if (!watchingEntries || watchingEntries.length === 0) {
        return;
      }

      // 2. Extract unique AniList IDs
      const mediaIdSet = new Set<number>();
      for (const entry of watchingEntries) {
        if (entry.media?.idAnilist) {
          mediaIdSet.add(entry.media.idAnilist);
        }
      }

      const mediaIds = Array.from(mediaIdSet);
      if (mediaIds.length === 0) return;

      // 3. Fetch airing schedule from AniList for the notification window
      let airingSchedules: any[];
      try {
        airingSchedules = await this.anilistScheduleClient.fetchCalendarSchedules({
          mediaIds,
          airingAtGreater: nowUnix,
          airingAtLesser: windowEnd,
          perPage: 500,
        });
      } catch (err: any) {
        logger.error(`[ScheduleCron] Failed to fetch airing schedules: ${err.message}`);
        return;
      }

      if (!airingSchedules || airingSchedules.length === 0) {
        return;
      }

      logger.debug(
        `[ScheduleCron] Found ${airingSchedules.length} episodes airing within ${DEFAULT_NOTIFY_BEFORE_SECONDS}s window`
      );

      // 4. Build a map of anilistId -> airing info
      const airingMap = new Map<number, any[]>();
      for (const schedule of airingSchedules) {
        const anilistId = schedule.mediaId || schedule.media?.id;
        if (!anilistId) continue;
        if (!airingMap.has(anilistId)) {
          airingMap.set(anilistId, []);
        }
        airingMap.get(anilistId)!.push(schedule);
      }

      // 5. For each watching entry, check if there's an airing schedule match
      for (const entry of watchingEntries) {
        const anilistId = entry.media?.idAnilist;
        if (!anilistId || !airingMap.has(anilistId)) continue;

        const schedulesForAnime = airingMap.get(anilistId)!;

        for (const schedule of schedulesForAnime) {
          const episodeNumber = schedule.episode || schedule.episodeNumber || 0;
          const airingAt = schedule.airingAt;
          const cacheKey = `${entry.userId}:${anilistId}:${episodeNumber}`;

          // Skip if already sent
          if (this.sentCache.has(cacheKey)) continue;

          const animeName =
            schedule.media?.title?.english ||
            schedule.media?.title?.romaji ||
            entry.media?.titleEnglish ||
            entry.media?.titleRomaji ||
            'Unknown Anime';

          const coverImage =
            schedule.media?.coverImage?.large ||
            schedule.media?.coverImage?.medium ||
            entry.media?.coverImage ||
            null;

          const airingDate = new Date(airingAt * 1000);
          const minutesUntil = Math.round((airingAt - Math.floor(Date.now() / 1000)) / 60);

          const title = `${animeName} - Episode ${episodeNumber}`;
          const body =
            minutesUntil > 0
              ? `Episode ${episodeNumber} airs in ${minutesUntil} minutes!`
              : `Episode ${episodeNumber} is airing now!`;

          try {
            await this.notificationService.createAndPush(
              BigInt(entry.userId),
              NotificationType.ANIME_AIRING,
              title,
              body,
              {
                animeId: anilistId,
                animeName,
                episodeNumber,
                airingAt: airingDate.toISOString(),
                coverImage,
              }
            );

            this.sentCache.add(cacheKey);
            logger.debug(
              `[ScheduleCron] Sent airing notification to user ${entry.userId}: ${animeName} ep${episodeNumber}`
            );
          } catch (err: any) {
            logger.error(
              `[ScheduleCron] Failed to send notification for ${animeName} ep${episodeNumber} to user ${entry.userId}: ${err.message}`
            );
          }
        }
      }
    } catch (error: any) {
      logger.error(`[ScheduleCron] Check failed: ${error.message}`);
    }
  }
}
