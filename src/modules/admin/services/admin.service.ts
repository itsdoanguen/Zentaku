import os from 'os';
import { AppDataSource } from '../../../config/database';
import httpClient from '../../../infrastructure/http/httpClient';

let lastCpus = os.cpus();

function getCpuUsagePercent(): number {
  const currentCpus = os.cpus();
  let idleDifference = 0;
  let totalDifference = 0;

  for (let i = 0; i < currentCpus.length; i++) {
    const startCpu = lastCpus[i];
    const endCpu = currentCpus[i];

    if (!startCpu || !endCpu) continue;

    const startTotal = Object.values(startCpu.times).reduce((a, b) => a + b, 0);
    const endTotal = Object.values(endCpu.times).reduce((a, b) => a + b, 0);

    totalDifference += endTotal - startTotal;
    idleDifference += endCpu.times.idle - startCpu.times.idle;
  }

  lastCpus = currentCpus;

  if (totalDifference === 0) return 0;
  return 100 - (100 * idleDifference) / totalDifference;
}

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

    const cpuUsage = getCpuUsagePercent(); // Real-time CPU usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = (usedMem / totalMem) * 100;

    // Anime Provider Ping Check
    const startAni = Date.now();
    let aniStatus = 'down';
    try {
      const aniUrl = process.env.FILMSERVER_BASE_URL;
      if (aniUrl) {
        await httpClient.get(aniUrl, { timeout: 5000 });
        aniStatus = 'up';
      }
    } catch (err: any) {
      // Even if it returns 404/401, it means the server is reachable.
      if (err.response) {
        aniStatus = 'up';
      } else {
        aniStatus = 'down';
      }
    }
    const aniPing = Date.now() - startAni;

    return {
      uptime: process.uptime(),
      db: {
        status: dbStatus,
        pingMs: dbPing,
      },
      animeServer: {
        status: aniStatus,
        pingMs: aniPing,
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
