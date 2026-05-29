import type { Repository } from 'typeorm';
import { BaseRepository } from '../../../core/base/BaseRepository';
import type { WatchRoomConfig } from '../../../entities/WatchRoomConfig.entity';

export class WatchRoomConfigRepository extends BaseRepository<WatchRoomConfig> {
  constructor(repository: Repository<WatchRoomConfig>) {
    super(repository);
  }

  async findByChannelId(channelId: bigint): Promise<WatchRoomConfig | null> {
    return this.findOne({
      where: { channelId },
      relations: ['channel', 'host', 'media'],
    });
  }

  async createWatchRoomConfig(data: Partial<WatchRoomConfig>): Promise<WatchRoomConfig> {
    return this.create(data);
  }

  async updateWatchRoomConfig(
    channelId: bigint,
    data: Partial<WatchRoomConfig>
  ): Promise<WatchRoomConfig> {
    const updated = await this.update(channelId, data);
    if (!updated) {
      throw new Error(`Failed to update watch room config with channel ID ${channelId}`);
    }
    return updated;
  }
}
