import { test, describe } from 'node:test';
import assert from 'node:assert';
import { JobQueue } from '../src/queue/inMemoryQueue.js';

describe('JobQueue Custom Metadata Support', () => {
  const dummyMetadata = {
    isDemo: true,
    type: 'playlist' as const,
    title: 'Top Hits Playlist',
    totalEntries: 2,
    entries: [
      {
        id: 'track-1',
        title: 'LAGU TERBARU!! Singer One - First Song (Official Music Video)',
        artist: 'Singer One',
        durationSec: 180,
        thumbnail: 'https://example.com/thumb1.jpg',
        url: 'https://www.youtube.com/watch?v=track-1'
      },
      {
        id: 'track-2',
        title: 'Singer Two - Second Song (Live Acoustic)',
        artist: 'Singer Two',
        durationSec: 210,
        thumbnail: 'https://example.com/thumb2.jpg',
        url: 'https://www.youtube.com/watch?v=track-2'
      }
    ]
  };

  test('Creates job with optional custom metadata overrides for tracks', () => {
    const queue = new JobQueue(1);

    const job = queue.createJob({
      id: 'job-custom-test',
      type: 'playlist',
      url: 'https://www.youtube.com/playlist?list=PL123',
      metadata: dummyMetadata,
      settings: {
        cleanerMode: 'Advanced',
        format: 'mp3',
        quality: '320',
        pitch: 2
      },
      selectedTrackIds: ['track-1', 'track-2'],
      customMetadata: {
        'track-1': {
          title: 'Custom Title One',
          artist: 'Custom Artist One',
          composer: 'Custom Composer One',
          album: 'Custom Album 2026',
          year: '2026',
          genre: 'Pop',
          trackNumber: '1',
          pitch: -1
        }
      }
    });

    assert.strictEqual(job.tracks.length, 2);
    assert.strictEqual(job.pitch, 2);

    const t1 = job.tracks[0];
    assert.strictEqual(t1.cleanedTitle, 'Custom Title One');
    assert.strictEqual(t1.artist, 'Custom Artist One');
    assert.strictEqual(t1.composer, 'Custom Composer One');
    assert.strictEqual(t1.album, 'Custom Album 2026');
    assert.strictEqual(t1.year, '2026');
    assert.strictEqual(t1.genre, 'Pop');
    assert.strictEqual(t1.trackNumber, '1');
    assert.strictEqual(t1.pitch, -1);
    assert.strictEqual(t1.robloxInfo?.type, 'PitchShift');
    assert.strictEqual(t1.robloxInfo?.value, '1.059');
    assert.strictEqual(t1.isCustomMetadata, true);
    assert.ok(t1.filename.includes('Custom Artist One - Custom Title One.mp3'));

    const t2 = job.tracks[1];
    assert.strictEqual(t2.artist, 'Singer Two');
    assert.ok(t2.cleanedTitle.includes('Second Song'));
    assert.strictEqual(t2.album, 'Top Hits Playlist');
    assert.strictEqual(t2.pitch, 2);
    assert.strictEqual(t2.robloxInfo?.type, 'PitchShift');
    assert.strictEqual(t2.robloxInfo?.value, '0.891');
    assert.strictEqual(t2.isCustomMetadata, false);

    queue.cancelJob(job.id);
  });
});
