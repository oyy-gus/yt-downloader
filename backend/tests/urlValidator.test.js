import test from 'node:test';
import assert from 'node:assert/strict';
import { validateUrl } from '../src/validators/urlValidator.js';

test('URL Validator and SSRF Protection Tests', async (t) => {
  await t.test('Validates YouTube Single Track URL', () => {
    const res = validateUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.equal(res.isValid, true);
    assert.equal(res.type, 'track');
    assert.equal(res.videoId, 'dQw4w9WgXcQ');
  });

  await t.test('Validates YouTube Playlist URL', () => {
    const res = validateUrl('https://www.youtube.com/playlist?list=PL1234567890');
    assert.equal(res.isValid, true);
    assert.equal(res.type, 'playlist');
    assert.equal(res.playlistId, 'PL1234567890');
  });

  await t.test('Validates YouTube Mix URL', () => {
    const res = validateUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDaBcDeFgHiJk');
    assert.equal(res.isValid, true);
    assert.equal(res.type, 'mix');
  });

  await t.test('Blocks Localhost / SSRF Attempts', () => {
    const res1 = validateUrl('http://localhost:5000/admin');
    assert.equal(res1.isValid, false);

    const res2 = validateUrl('http://169.254.169.254/latest/meta-data/');
    assert.equal(res2.isValid, false);
  });
});
