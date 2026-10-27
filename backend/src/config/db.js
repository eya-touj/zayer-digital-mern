const mongoose = require('mongoose');

let connecting = false;
let retryTimer;

async function connectDB() {
  if (connecting || mongoose.connection.readyState === 1) return;
  connecting = true;
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zayer_digital';

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3500,
      connectTimeoutMS: 3500,
      maxPoolSize: 5,
      minPoolSize: 0,
      autoIndex: process.env.NODE_ENV !== 'production',
    });
    console.info('[db] MongoDB connected');
  } catch (error) {
    console.warn('[db] MongoDB unavailable; local JSON storage is active');
    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = undefined;
        connectDB();
      }, 30000);
      retryTimer.unref?.();
    }
  } finally {
    connecting = false;
  }
}

function getDbStatus() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, getDbStatus };
