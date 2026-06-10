import fs from 'node:fs';
import path from 'node:path';
import multer, { type FileFilterCallback } from 'multer';
import type { Request } from 'express';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const MAX_BANNER_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const ensureDir = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const getUploadRoot = (): string => path.resolve(process.cwd(), 'public', 'uploads', 'users');

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new Error('Invalid file type. Allowed types: jpg, png, webp'));
    return;
  }

  cb(null, true);
};

const createStorage = (folder: 'avatar' | 'banner') =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const destinationDir = path.join(getUploadRoot(), folder);
      ensureDir(destinationDir);
      cb(null, destinationDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, name);
    },
  });

export const avatarUpload = multer({
  storage: createStorage('avatar'),
  fileFilter,
  limits: { fileSize: MAX_AVATAR_SIZE },
});

export const bannerUpload = multer({
  storage: createStorage('banner'),
  fileFilter,
  limits: { fileSize: MAX_BANNER_SIZE },
});

export const listBannerUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const destinationDir = path.resolve(process.cwd(), 'public', 'uploads', 'lists', 'banner');
      ensureDir(destinationDir);
      cb(null, destinationDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, name);
    },
  }),
  fileFilter,
  limits: { fileSize: MAX_BANNER_SIZE },
});

// ==================== MOVIE UPLOAD (Video + Subtitle) ====================

const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
const ALLOWED_VIDEO_MIMES = new Set(['video/mp4', 'video/x-matroska', 'video/webm']);
const ALLOWED_SUBTITLE_EXTS = new Set(['.vtt', '.srt', '.ass']);

const movieFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'video') {
    if (ALLOWED_VIDEO_MIMES.has(file.mimetype) || ['.mp4', '.mkv', '.webm'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid video file type: ${file.mimetype}. Allowed: mp4, mkv, webm`));
    }
  } else if (file.fieldname === 'subtitle') {
    if (ALLOWED_SUBTITLE_EXTS.has(ext) || file.mimetype === 'text/vtt') {
      cb(null, true);
    } else {
      cb(new Error(`Invalid subtitle file type: ${ext}. Allowed: vtt, srt, ass`));
    }
  } else {
    cb(new Error(`Unexpected field: ${file.fieldname}`));
  }
};

export const movieUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const destinationDir = path.resolve(process.cwd(), 'public', 'uploads', 'movies', 'temp');
      ensureDir(destinationDir);
      cb(null, destinationDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, name);
    },
  }),
  fileFilter: movieFileFilter,
  limits: { fileSize: MAX_VIDEO_SIZE },
});
