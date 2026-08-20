import { toFile } from 'openai';

export class AudioBufferManager {
  constructor() {
    this.chunks = [];
    this.totalBytes = 0;
  }

  append(chunk) {
    if (Buffer.isBuffer(chunk)) {
      this.chunks.push(chunk);
      this.totalBytes += chunk.length;
    }
  }

  getCombinedBuffer() {
    return Buffer.concat(this.chunks, this.totalBytes);
  }

  getSize() {
    return this.totalBytes;
  }

  isEmpty() {
    return this.chunks.length === 0 || this.totalBytes < 400;
  }

  clear() {
    this.chunks = [];
    this.totalBytes = 0;
  }
}

export async function bufferToFileLike(buffer, filename = 'speech.webm', mimeType = 'audio/webm') {
  return await toFile(buffer, filename, { type: mimeType });
}

export function base64ToBuffer(base64) {
  if (!base64) return Buffer.alloc(0);
  const cleanBase64 = base64.replace(/^data:audio\/[a-z0-9]+;base64,/, '');
  return Buffer.from(cleanBase64, 'base64');
}

export function bufferToBase64(buffer, mimeType = 'audio/mp3') {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}
