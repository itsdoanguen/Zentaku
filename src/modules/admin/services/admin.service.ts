import os from 'os';
import { AppDataSource } from '../../../config/database';

export class AdminService {
  async getSystemHealth() {
    const startDb = Date.now();
    let dbStatus = 'down';
    try {
      if (AppDataSource.isInitialized) {
        await AppDataSource.query('SELECT 1');
        dbStatus = 'up';
      }
    } catch {
      dbStatus = 'down';
    }
    const dbPing = Date.now() - startDb;

    const cpuUsage = os.loadavg()[0]; // 1 minute load average
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = (usedMem / totalMem) * 100;

    return {
      uptime: process.uptime(),
      db: {
        status: dbStatus,
        pingMs: dbPing,
      },
      cpu: {
        loadAvg1m: cpuUsage,
        cores: os.cpus().length,
      },
      memory: {
        totalGb: (totalMem / 1024 / 1024 / 1024).toFixed(2),
        usedGb: (usedMem / 1024 / 1024 / 1024).toFixed(2),
        usagePercent: memUsagePercent.toFixed(2),
      },
      timestamp: new Date(),
    };
  }
}
