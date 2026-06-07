import type { Request, Response } from 'express';
import type { AdminService } from '../services/admin.service';

export class AdminController {
  constructor(private readonly adminService: AdminService) {
    this.getHealth = this.getHealth.bind(this);
  }

  async getHealth(_req: Request, res: Response): Promise<void> {
    try {
      const health = await this.adminService.getSystemHealth();
      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch system health',
      });
    }
  }
}
