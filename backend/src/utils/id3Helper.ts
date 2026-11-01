import NodeID3 from 'node-id3';
import fs from 'fs';

interface ThumbnailBuffer {
  mime: string;
  buffer: Buffer;
}

interface MetadataInput {
  title?: string | null;
  artist?: string | null;
  album?: string | null;
  year?: string | null;
  genre?: string | null;
  composer?: string | null;
  trackNumber?: string | null;
  thumbnailUrl?: string | null;
}

async function fetchThumbnailBuffer(url: string | null | undefined, timeoutMs: number = 4000): Promise<ThumbnailBuffer | null> {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const arrayBuf = await res.arrayBuffer();
    const rawType = res.headers.get('content-type') || 'image/jpeg';
    const mime = rawType.split(';')[0].trim();

    return {
      mime: mime.startsWith('image/') ? mime : 'image/jpeg',
      buffer: Buffer.from(arrayBuf)
    };
  } catch (err) {
    return null;
  }
}

export async function writeMp3Metadata(filePath: string, metadata: MetadataInput = {}): Promise<boolean> {
  if (!filePath || !filePath.toLowerCase().endsWith('.mp3')) {
    return false;
  }

  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    const tags: any = {};

    if (metadata.title) {
      tags.title = String(metadata.title).trim();
    }
    if (metadata.artist) {
      tags.artist = String(metadata.artist).trim();
    }
    if (metadata.album) {
      tags.album = String(metadata.album).trim();
    }
    if (metadata.year) {
      tags.year = String(metadata.year).trim();
    }
    if (metadata.genre) {
      tags.genre = String(metadata.genre).trim();
    }
    if (metadata.composer) {
      tags.composer = String(metadata.composer).trim();
    }
    if (metadata.trackNumber) {
      tags.trackNumber = String(metadata.trackNumber).trim();
    }

    if (metadata.thumbnailUrl) {
      const cover = await fetchThumbnailBuffer(metadata.thumbnailUrl);
      if (cover && cover.buffer) {
        tags.image = {
          mime: cover.mime,
          type: { id: 3, name: 'front cover' },
          description: 'Album Artwork',
          imageBuffer: cover.buffer
        };
      }
    }

    const success = NodeID3.update(tags, filePath);
    return !!success;
  } catch (err: any) {
    console.warn(`[id3Helper] Failed to write ID3 tags to ${filePath}: ${err.message}`);
    return false;
  }
}
