import type { Request, Response, NextFunction } from 'express';
import type { LibraryEntryRepository } from '../follow/repositories/library-entry.repository';
import type AnilistScheduleClient from '../../infrastructure/external/anilist/schedule/AnilistScheduleClient';
import { LibraryStatus } from '../../entities/types/enums';

export default class ScheduleController {
  constructor(
    private readonly libraryEntryRepository: LibraryEntryRepository,
    private readonly anilistScheduleClient: AnilistScheduleClient
  ) {}

  /**
   * Get personalized airing schedule for the user
   */
  getSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { start, end } = req.query;
      const airingAtGreater = start ? parseInt(start as string, 10) : undefined;
      const airingAtLesser = end ? parseInt(end as string, 10) : undefined;

      // 1. Get all CURRENT (Watching) library entries for this user
      // We need to bypass pagination or fetch a reasonable amount (e.g. up to 500)
      const entries = await this.libraryEntryRepository.findMany({
        where: { userId: BigInt(userId), status: LibraryStatus.WATCHING },
        relations: ['media'],
        take: 500,
      });

      // Extract AniList IDs
      const mediaIds = entries
        .map((entry: any) => entry.media.idAnilist)
        .filter((id: any): id is number => id !== null && id !== undefined);

      if (mediaIds.length === 0) {
        res.json({
          success: true,
          data: {
            calendarEvents: [],
            upNextEvents: [],
          },
        });
        return;
      }

      // 2. Fetch Calendar Events
      const calendarEvents = await this.anilistScheduleClient.fetchCalendarSchedules({
        mediaIds,
        airingAtGreater,
        airingAtLesser,
        perPage: 500, // Assuming one month won't have more than 500 episodes for 1 user
      });

      // 3. Fetch Up Next Events
      // To get up next, we use notYetAired: true which we added in UP_NEXT_SCHEDULE_QS
      const upNextEvents = await this.anilistScheduleClient.fetchUpNextSchedules({
        mediaIds,
        perPage: 50, // Get next 50 episodes across all watching shows
      });

      res.json({
        success: true,
        data: {
          calendarEvents,
          upNextEvents,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
