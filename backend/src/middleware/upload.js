const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDirectory = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = new Map([
  ['image/jpeg', ['.jpg', '.jpeg']], ['image/png', ['.png']], ['image/webp', ['.webp']], ['image/gif', ['.gif']],
  ['video/mp4', ['.mp4']], ['application/pdf', ['.pdf']],
]);

function matchesSignature(mime, data) {
  if (mime === 'image/jpeg') return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (mime === 'image/png') return data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === 'image/gif') return data.length >= 6 && /^GIF8[79]a$/.test(data.toString('ascii', 0, 6));
  if (mime === 'image/webp') return data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP';
  if (mime === 'video/mp4') return data.length >= 12 && data.toString('ascii', 4, 8) === 'ftyp';
  if (mime === 'application/pdf') return data.length >= 5 && data.toString('ascii', 0, 5) === '%PDF-';
  return false;
}

const storage = {
  _handleFile(_req, file, callback) {
    const chunks = [];
    let size = 0;
    file.stream.on('data', (chunk) => { chunks.push(chunk); size += chunk.length; });
    file.stream.once('error', callback);
    file.stream.once('end', () => {
      const data = Buffer.concat(chunks, size);
      if (!matchesSignature(file.mimetype, data)) {
        callback(new Error('Only JPEG, PNG, WebP, GIF, MP4 and PDF files are accepted'));
        return;
      }
      const extension = path.extname(file.originalname).toLowerCase();
      const filename = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${extension}`;
      const target = path.join(uploadDirectory, filename);
      fs.writeFile(target, data, { flag: 'wx', mode: 0o640 }, (error) => {
        if (error) { callback(error); return; }
        callback(null, { destination: uploadDirectory, filename, path: target, size });
      });
    });
  },
  _removeFile(_req, file, callback) {
    fs.unlink(file.path, callback);
  },
};

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const expected = allowedTypes.get(file.mimetype);
    if (!expected || !expected.includes(extension)) return callback(new Error('Only JPEG, PNG, WebP, GIF, MP4 and PDF files are accepted'));
    return callback(null, true);
  },
});

const resumeUpload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (file.mimetype !== 'application/pdf' || extension !== '.pdf') return callback(new Error('Only PDF resumes are accepted'));
    return callback(null, true);
  },
});

module.exports = { upload, resumeUpload, uploadDirectory };
