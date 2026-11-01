import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_BASE_DIR = path.resolve(process.env.TEMP_DIR || path.join(__dirname, '../../tmp'));
const EXPIRATION_MS = (parseInt(process.env.TEMP_FILE_EXPIRATION_HOURS || '2', 10) || 2) * 60 * 60 * 1000;

export class TempStorageManager {
  static async init(): Promise<void> {
    try {
      await fs.mkdir(TEMP_BASE_DIR, { recursive: true });
    } catch (err) {
      console.error('[TempStorageManager] Failed to create base temp directory:', err);
    }
  }

  static getJobDir(jobId: string): string {
    const safeJobId = String(jobId).replace(/[^a-zA-Z0-9_-]/g, '');
    return path.join(TEMP_BASE_DIR, safeJobId);
  }

  static async createJobDir(jobId: string): Promise<string> {
    const jobDir = this.getJobDir(jobId);
    await fs.mkdir(jobDir, { recursive: true });
    return jobDir;
  }

  static async removeJobDir(jobId: string): Promise<void> {
    const jobDir = this.getJobDir(jobId);
    try {
      await fs.rm(jobDir, { recursive: true, force: true });
    } catch (err: any) {
      console.warn(`[TempStorageManager] Error removing job directory ${jobId}:`, err.message);
    }
  }

  static async cleanExpiredFiles(): Promise<void> {
    try {
      await fs.mkdir(TEMP_BASE_DIR, { recursive: true });
      const entries = await fs.readdir(TEMP_BASE_DIR, { withFileTypes: true });
      const now = Date.now();

      for (const entry of entries) {
        const fullPath = path.join(TEMP_BASE_DIR, entry.name);
        try {
          const stats = await fs.stat(fullPath);
          if (now - stats.mtimeMs > EXPIRATION_MS) {
            await fs.rm(fullPath, { recursive: true, force: true });
            console.log(`[TempStorageManager] Cleaned expired temp item: ${entry.name}`);
          }
        } catch (_) {}
      }
    } catch (err) {
      console.error('[TempStorageManager] Expired files cleanup failed:', err);
    }
  }
}
