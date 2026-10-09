import test from 'node:test';
import assert from 'node:assert/strict';
import { TitleCleanerEngine } from '../src/cleaner/titleCleanerEngine.js';

test('TitleCleanerEngine - Advanced Mode Test Cases from Specification', async (t) => {
  const cleaner = new TitleCleanerEngine();

  await t.test('Cleans promotional prefix and video technical tags', () => {
    const input = 'LAGU TERBARU 2026!! Budi Doremi - Melukis Senja (Official Music Video) HD';
    const result = cleaner.clean(input, { mode: 'Advanced', format: 'mp3' });
    
    assert.equal(result.cleanedTitle, 'Budi Doremi - Melukis Senja');
    assert.equal(result.proposedFilename, 'Budi Doremi - Melukis Senja.mp3');
    assert.equal(result.detectedArtist, 'Budi Doremi');
  });

  await t.test('Cleans Indonesian Koplo/Dangdut promo while keeping artist', () => {
    const input = 'DJ JAWA FULL ALBUM TERBARU 2026 - Denok - Ajeng Febria (Official Video)';
    const result = cleaner.clean(input, { mode: 'Advanced', metadataArtist: 'Ajeng Febria', format: 'mp3' });

    assert.equal(result.detectedArtist, 'Ajeng Febria');
    assert.equal(result.proposedFilename.includes('Ajeng Febria'), true);
  });

  await t.test('Preserves genuine version (Slow Remix)', () => {
    const input = 'Nama Artis - Nama Lagu (Slow Remix) FULL ALBUM';
    const result = cleaner.clean(input, { mode: 'Advanced', format: 'mp3' });

    assert.equal(result.detectedVersion, 'Slow Remix');
    assert.equal(result.cleanedTitle.includes('Slow Remix'), true);
  });

  await t.test('Preserves genuine version (Live Version)', () => {
    const input = 'Nama Artis - Lagu Cinta (Live Version) Official Video 1080p';
    const result = cleaner.clean(input, { mode: 'Advanced', format: 'mp3' });

    assert.equal(result.detectedVersion, 'Live Version');
    assert.equal(result.cleanedTitle.includes('Live Version'), true);
  });
});
