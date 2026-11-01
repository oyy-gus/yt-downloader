import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import NodeID3 from 'node-id3';
import { writeMp3Metadata } from '../src/utils/id3Helper.js';

describe('ID3 Tagging & Metadata Embedding', () => {
  const testMp3Path = path.join(process.cwd(), 'temp_test_tag.mp3');

  before(() => {
    fs.writeFileSync(testMp3Path, Buffer.alloc(2048));
  });

  after(() => {
    if (fs.existsSync(testMp3Path)) {
      fs.unlinkSync(testMp3Path);
    }
  });

  test('Writes custom ID3 tags accurately to MP3 file', async () => {
    const metadata = {
      title: 'Melukis Senja (Acoustic)',
      artist: 'Budi Doremi',
      composer: 'Budi Doremi',
      album: 'Dua Buku Deluxe',
      year: '2024',
      genre: 'Indie Pop',
      trackNumber: '1'
    };

    const success = await writeMp3Metadata(testMp3Path, metadata);
    assert.strictEqual(success, true);

    const readTags = NodeID3.read(testMp3Path);
    assert.strictEqual(readTags.title, metadata.title);
    assert.strictEqual(readTags.artist, metadata.artist);
    assert.strictEqual(readTags.composer, metadata.composer);
    assert.strictEqual(readTags.album, metadata.album);
    assert.strictEqual(readTags.year, metadata.year);
    assert.strictEqual(readTags.genre, metadata.genre);
    assert.strictEqual(readTags.trackNumber, metadata.trackNumber);
  });

  test('Gracefully handles non-mp3 files or non-existent files', async () => {
    const result1 = await writeMp3Metadata('non_existent.mp3', { title: 'Test' });
    assert.strictEqual(result1, false);

    const result2 = await writeMp3Metadata('test.wav', { title: 'Test' });
    assert.strictEqual(result2, false);
  });
});
