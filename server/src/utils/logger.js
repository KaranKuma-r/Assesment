export const logger = {
  info: (msg, meta) => {
    const ts = new Date().toISOString().split('T')[1].slice(0, 8);
    console.log(`\x1b[36m[${ts}] ℹ️ INFO:\x1b[0m ${msg}`, meta !== undefined ? meta : '');
  },
  warn: (msg, meta) => {
    const ts = new Date().toISOString().split('T')[1].slice(0, 8);
    console.warn(`\x1b[33m[${ts}] ⚠️ WARN:\x1b[0m ${msg}`, meta !== undefined ? meta : '');
  },
  error: (msg, meta) => {
    const ts = new Date().toISOString().split('T')[1].slice(0, 8);
    console.error(`\x1b[31m[${ts}] ❌ ERROR:\x1b[0m ${msg}`, meta !== undefined ? meta : '');
  },
  voice: (msg, meta) => {
    const ts = new Date().toISOString().split('T')[1].slice(0, 8);
    console.log(`\x1b[35m[${ts}] 🎙️ VOICE:\x1b[0m ${msg}`, meta !== undefined ? meta : '');
  },
  success: (msg, meta) => {
    const ts = new Date().toISOString().split('T')[1].slice(0, 8);
    console.log(`\x1b[32m[${ts}] ✅ SUCCESS:\x1b[0m ${msg}`, meta !== undefined ? meta : '');
  }
};
