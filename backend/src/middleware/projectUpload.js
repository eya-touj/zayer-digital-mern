const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { Transform, pipeline } = require('stream');

const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 200;
const TEMP_DIRECTORY = path.join(os.tmpdir(), 'zayer-project-uploads');
const allowedExtensions = new Set([
  '.html', '.htm', '.css', '.js', '.mjs', '.json', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif',
  '.ico', '.woff', '.woff2', '.ttf', '.mp4', '.pdf', '.txt', '.webmanifest',
]);

fs.mkdirSync(TEMP_DIRECTORY, { recursive: true });

const storage = {
  _handleFile(req, file, callback) {
    const temporaryPath = path.join(TEMP_DIRECTORY, `${crypto.randomUUID()}.upload`);
    const limiter = new Transform({
      transform(chunk, _encoding, done) {
        const total = (req.projectUploadBytes || 0) + chunk.length;
        if (total > MAX_TOTAL_SIZE) {
          const error = Object.assign(new Error('Project uploads may not exceed 50 MB total'), { code: 'PROJECT_UPLOAD_TOO_LARGE', status: 413 });
          done(error);
          return;
        }
        req.projectUploadBytes = total;
        this.bytesWritten = (this.bytesWritten || 0) + chunk.length;
        done(null, chunk);
      },
    });
    pipeline(file.stream, limiter, fs.createWriteStream(temporaryPath, { flags: 'wx', mode: 0o600 }), (error) => {
      if (error) {
        fs.promises.unlink(temporaryPath).catch((cleanupError) => {
          if (cleanupError.code !== 'ENOENT') console.error('[portfolio-upload] Failed to remove partial upload');
        });
        callback(error);
        return;
      }
      callback(null, { path: temporaryPath, size: limiter.bytesWritten });
    });
  },
  _removeFile(_req, file, callback) {
    fs.unlink(file.path, (error) => callback(error?.code === 'ENOENT' ? null : error));
  },
};

function fileFilter(_req, file, callback) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.has(extension)) {
    callback(Object.assign(new Error('Unsupported project file type'), { code: 'PROJECT_FILE_TYPE', status: 415 }));
    return;
  }
  callback(null, true);
}

const projectFolderUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_TOTAL_SIZE,
    files: MAX_FILES,
    fields: 2,
    fieldNameSize: 64,
    fieldSize: 120000,
    parts: MAX_FILES + 2,
  },
}).array('files', MAX_FILES);

module.exports = { projectFolderUpload, MAX_TOTAL_SIZE, MAX_FILES };
