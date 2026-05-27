import AnilistClient from '../AnilistClient';
import { AIRING_SCHEDULE_QS, UP_NEXT_SCHEDULE_QS } from './anilist-schedule.queries';
import type { AiringScheduleEdge, AiringScheduleResponse } from './anilist-schedule.types';

export interface ScheduleQueryOptions {
  mediaIds: number[];
  airingAtGreater?: number;
  airingAtLesser?: number;
  page?: number;
  perPage?: number;
}

export default class AnilistScheduleClient extends AnilistClient {
  /**
   * Fetch calendar airing schedules for given media IDs within a timeframe
   */
  async fetchCalendarSchedules(options: ScheduleQueryOptions): Promise<AiringScheduleEdge[]> {
    const { mediaIds, airingAtGreater, airingAtLesser, page = 1, perPage = 50 } = options;

    // If no media IDs provided, return empty to save API calls
    if (!mediaIds || mediaIds.length === 0) {
      return [];
    }

    const data = await this.executeQuery<AiringScheduleResponse>(
      AIRING_SCHEDULE_QS,
      {
        mediaIds,
        airingAt_greater: airingAtGreater,
        airingAt_lesser: airingAtLesser,
        page,
        perPage,
      },
      `fetchCalendarSchedules(mediaCount:${mediaIds.length})`
    );

    return data?.Page?.airingSchedules || [];
  }

  /**
   * Fetch upcoming schedules for given media IDs (not yet aired)
   */
  async fetchUpNextSchedules(options: ScheduleQueryOptions): Promise<AiringScheduleEdge[]> {
    const { mediaIds, page = 1, perPage = 50 } = options;

    if (!mediaIds || mediaIds.length === 0) {
      return [];
    }

    const data = await this.executeQuery<AiringScheduleResponse>(
      UP_NEXT_SCHEDULE_QS,
      {
        mediaIds,
        page,
        perPage,
      },
      `fetchUpNextSchedules(mediaCount:${mediaIds.length})`
    );

    return data?.Page?.airingSchedules || [];
  }
}
