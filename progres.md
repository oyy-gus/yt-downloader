MAXISTRONG

Production-Ready Music Downloader Web Application

Project Name: Maxistrong
Backend: Node.js + Express.js
Frontend: Next.js + React
Language: JavaScript (ES Modules)
UI: Modern Premium Dark Mode
Deployment: Linux VPS
API Key: No mandatory YouTube Data API key
Primary Features: Single Track, Playlist, YouTube Mix, Audio Quality Selection, Automatic Title Cleaner, ZIP Export

---

1. PROJECT OBJECTIVE

Build Maxistrong, a modern, reliable, responsive music-processing web application with an intuitive interface and a modular backend.

Users should be able to submit supported URLs, inspect available track information, choose audio output settings, process eligible audio, and download individual files or multiple files in a ZIP archive.

The application must support:

- Individual track analysis and processing.
- Playlist recognition and batch processing.
- Best-effort YouTube Mix recognition.
- Audio format and quality selection.
- Automatic title cleaning and filename normalization.
- Embedded audio metadata management.
- Playlist selection and batch download.
- Individual audio file downloads.
- ZIP archive creation.
- Real-time processing progress.
- Job queues, cancellation, retries, and error handling.
- Responsive mobile and desktop layouts.
- Automatic temporary-file cleanup.
- Secure deployment and configuration.

This must be a real, maintainable application, not merely a frontend mockup.

Only process audio that the user owns, is licensed to download, is in the public domain, or is otherwise explicitly permitted to be downloaded and processed. Do not bypass DRM, authentication requirements, access controls, or platform protections.

2. BRANDING AND VISUAL IDENTITY

The official application name is Maxistrong.

Use this name consistently across the website, browser metadata, favicon, navigation, loading screens, errors, footer, README, and deployment documentation.

Design Direction

Create a premium, music-focused dark interface.

- Deep charcoal or near-black background.
- Refined dark surfaces and cards.
- Restrained purple or electric-blue accent color.
- Clean typography.
- Consistent rounded corners.
- Subtle transitions and hover effects.
- Accessible text contrast.
- Clear progress and status indicators.
- Minimal clutter and no excessive decoration.

The application must look polished on mobile, tablet, and desktop.

Do not use placeholder branding from a starter template.

3. TECHNOLOGY STACK

Frontend

- Next.js.
- React.
- JavaScript or TypeScript where appropriate.
- Tailwind CSS.
- shadcn/ui.
- Lucide icons.
- Responsive component architecture.

Backend

- Node.js.
- Express.js.
- JavaScript ES Modules.
- REST API.
- Server-Sent Events (SSE) for live progress.
- Zod or equivalent input validation.

Media and File Processing

- FFmpeg for authorized media conversion.
- Archiver for streaming ZIP creation.
- A suitable metadata library or FFmpeg metadata options.
- Temporary file storage.
- Stream-based file processing.

Queue System

Start with a modular, bounded in-process queue for a single-instance deployment. Design an adapter interface so a persistent queue can be introduced later.

Do not require Redis, PostgreSQL, or a database for the initial version.

Do not store large media files in application memory unnecessarily.

4. URL ANALYSIS AND SOURCE SUPPORT

Create a URL analysis system that distinguishes:

1. Individual track URLs.
2. Playlist URLs.
3. YouTube Mix URLs.
4. Unsupported URLs.

Validate all URLs on the backend and accept only explicitly supported domains.

Retrieve metadata only through available and permitted sources.

Display, when available:

- Track title.
- Artist or channel name.
- Thumbnail.
- Duration.
- Playlist title.
- Number of discovered entries.
- Track availability.
- Processing status.

Do not fabricate missing metadata or claim that an unsupported URL has been processed successfully.

No Mandatory YouTube Data API Key

The initial application must not require a YouTube Data API key just to start.

Use modular provider adapters and open-source components where appropriate.

Keep metadata retrieval separate from authorized audio processing. Metadata access does not imply permission or technical access to an audio stream.

Document provider limitations clearly. Do not assume that third-party extractors will always work or that every source is available without credentials.

Provide a functional development mode with sample metadata when no provider is configured. Clearly label demo results and never pretend that demo audio has actually been downloaded.

5. SINGLE TRACK PROCESSING

For a supported and eligible track:

1. Validate the URL.
2. Retrieve available metadata.
3. Preview the track information.
4. Apply the title cleaner.
5. Let the user choose an available output format.
6. Let the user choose an available audio quality.
7. Validate the requested settings.
8. Process the permitted audio.
9. Write cleaned metadata where supported.
10. Verify the output file.
11. Display the final filename.
12. Provide a download link.

If the source is unavailable or processing is not permitted, display an informative error instead of returning a fake file.

6. PLAYLIST SUPPORT

Implement playlist recognition and batch processing.

Users must be able to:

- Preview discovered playlist entries.
- Select or deselect individual tracks.
- Select all eligible tracks.
- Process selected entries or all eligible entries.
- Choose one audio quality for the entire batch.
- Monitor individual track statuses.
- Cancel the job.
- Retry eligible transient failures.
- Download successful tracks individually.
- Download all successful tracks in one ZIP archive.

Each processed track must remain a separate audio file.

Example:

"Maxistrong_Playlist.zip"

- "001 - Artist - Track One.mp3"
- "002 - Artist - Track Two.mp3"
- "003 - Artist - Track Three.mp3"
- "download-summary.txt"

Never merge the playlist into a single long audio recording by default.

If one entry fails, continue processing other eligible entries where possible.

Set configurable limits for playlist size, concurrency, duration, storage, and retries.

7. YOUTUBE MIX SUPPORT

Implement best-effort recognition of YouTube Mix URLs, including URLs with parameters such as "list=RD...".

The system should:

- Identify likely Mix URLs.
- Attempt to retrieve entries available through the configured provider.
- Display discovered entries.
- Apply duplicate detection where reliable.
- Support the same queue, title cleaning, quality selection, and ZIP workflow as playlists.
- Handle dynamic, incomplete, unavailable, or unsupported Mixes.
- Report the number of entries discovered and processed.
- Explain limitations when the Mix cannot be resolved.

Do not promise that every Mix can be enumerated completely.

Do not bypass access controls, authentication requirements, DRM, or platform protections.

Offer a fallback workflow using user-provided URLs or supported sources for content the user is permitted to process.

8. AUDIO FORMAT AND QUALITY SELECTION

Audio quality selection is a core feature and must be connected to the actual backend processing pipeline.

Output Formats

Provide the following when supported:

- MP3.
- Original audio format.

Do not show unavailable format options as if they were functional.

MP3 Quality Options

Provide configurable options:

- Best Available.
- 320 kbps.
- 256 kbps.
- 192 kbps.
- 128 kbps.

Only offer options the configured processing pipeline can support.

For MP3, distinguish between source quality, selected output bitrate, and actual output encoding settings.

Converting a low-quality source to a higher bitrate does not restore lost audio detail.

When the requested quality is unavailable, provide a clear explanation and offer a valid fallback or request another selection.

Interface

Provide a compact format and quality selection panel with:

- Output format selector.
- Audio quality selector.
- Short quality explanation.
- Validation feedback.
- Estimated output information only when a reliable estimate is available.

Do not invent file-size estimates or audio-quality claims.

Playlist and Mix Quality

Apply one selected batch quality consistently to eligible entries.

Validate each entry independently, report failures clearly, and continue with other eligible tracks.

Never silently substitute an unsupported quality without informing the user.

Backend Validation

- Validate all format and quality options server-side.
- Use fixed, validated FFmpeg arguments.
- Never assemble shell commands from user input.
- Verify actual output format and encoding settings where possible.
- Report actual output properties in the job result.
- Handle conversion failures safely.

9. ADVANCED AUTOMATIC TITLE CLEANER

Implement a dedicated, modular Advanced Track Title Cleaner.

The default cleaning mode must be Advanced.

The objective is to ensure that users normally do not need to rename files manually after processing.

Clean filenames before output generation and ZIP creation. Write corresponding cleaned metadata into the output file where supported.

9.1 Promotional Album Labels

Recognize and remove irrelevant occurrences of:

- FULL ALBUM.
- ALBUM FULL.
- FULL ALBUM TERBARU.
- FULL ALBUM LENGKAP.
- ALBUM LENGKAP.
- KUMPULAN LAGU.
- KOLEKSI LAGU.
- KUMPULAN LAGU TERBAIK.
- BEST SONGS COLLECTION.
- BEST OF.
- NONSTOP.
- NON STOP.
- MIXTAPE.
- LONGPLAY.
- MEGA MIX.
- DJ MIX COLLECTION.
- ALBUM TERBARU.
- ALBUM POPULER.

Remove these only when they are upload descriptions or promotional annotations, not genuine title components.

9.2 Video and Technical Labels

Recognize and remove irrelevant annotations such as:

- OFFICIAL VIDEO.
- OFFICIAL MUSIC VIDEO.
- OFFICIAL LYRIC VIDEO.
- LYRIC VIDEO.
- LYRICS VIDEO.
- MUSIC VIDEO.
- VIDEO LIRIK.
- VIDEO KLIP.
- KLIP RESMI.
- OFFICIAL AUDIO.
- OFFICIAL VISUALIZER.
- AUDIO OFFICIAL.
- VISUALIZER.
- HD VIDEO.
- HQ AUDIO.
- FULL HD.
- 4K.
- 8K.
- 1080P.
- 720P.
- 480P.
- 360P.
- 2160P.
- 1440P.
- HDR.
- 60FPS.
- 50FPS.

Only remove technical annotations when they are not part of the genuine recording title or release information.

9.3 Promotional Keywords

Recognize contextual promotional text including:

- TERBARU.
- LAGU TERBARU.
- HITS TERBARU.
- VIRAL.
- LAGU VIRAL.
- SEDANG VIRAL.
- TRENDING.
- TRENDING NOW.
- POPULER.
- TERPOPULER.
- TOP HITS.
- HITS TERBAIK.
- WAJIB DENGAR.
- LAGU PILIHAN.
- REKOMENDASI.
- NEW RELEASE.
- LATEST SONG.
- BRAND NEW SONG.
- BEST QUALITY.
- ORIGINAL QUALITY.
- HIGH QUALITY.
- NO ADS.
- FULL VERSION.
- MP3 DOWNLOAD.
- DOWNLOAD MP3.
- DOWNLOAD LAGU.
- FREE DOWNLOAD.
- VIRAL TIKTOK.
- TIKTOK VIRAL.
- FYP.
- FOR YOU PAGE.
- SHORTS.
- REUPLOAD.
- RE-UPLOAD.

Do not remove a word merely because it appears in this dictionary. Use phrase boundaries and contextual rules.

9.4 Indonesian and Regional Music Patterns

Provide contextual cleaning rules for Indonesian and regional music uploads, including:

- DANGDUT TERBARU.
- DANGDUT VIRAL.
- DANGDUT FULL ALBUM.
- DANGDUT KOPLO TERBARU.
- KOPLO TERBARU.
- KOPLO VIRAL.
- CAMPURSARI TERBARU.
- CAMPURSARI VIRAL.
- MUSIK JAWA TERBARU.
- LAGU JAWA TERBARU.
- LAGU JAWA VIRAL.
- DJ JAWA.
- DJ DANGDUT.
- DJ KOPLO.
- DJ FULL ALBUM.
- FULL ALBUM DANGDUT.
- FULL ALBUM KOPLO.
- FULL ALBUM POP INDONESIA.
- FULL ALBUM CAMPURSARI.
- LAGU TERBARU followed by an upload year.
- ALBUM TERBARU followed by an upload year.

The year must be detected dynamically. Do not hardcode the current year.

Preserve meaningful genre, performer, and version information.

For example:

Input:
"LAGU TERBARU 2026!! Budi Doremi - Melukis Senja (Official Music Video) HD"

Output:
"Budi Doremi - Melukis Senja.mp3"

Input:
"DJ JAWA FULL ALBUM TERBARU 2026 - Denok - Ajeng Febria (Official Video)"

Preferred output when metadata confirms the artist and title:
"Ajeng Febria - Denok.mp3"

If the artist and title cannot be identified reliably, use a conservative cleaned title rather than inventing metadata.

9.5 Channel Promotion

Remove irrelevant annotations such as:

- SUBSCRIBE NOW.
- PLEASE SUBSCRIBE.
- LIKE AND SHARE.
- LIKE COMMENT SUBSCRIBE.
- JANGAN LUPA SUBSCRIBE.
- JANGAN LUPA LIKE.
- SUPPORT CHANNEL.
- FOLLOW US.
- FOLLOW ME.
- SHARE THIS VIDEO.
- TURN ON NOTIFICATIONS.

Do not blindly remove actual artist names, record labels, band names, or remix-producer credits.

Do not assume that a channel name is the artist.

9.6 Preserve Genuine Versions

Preserve meaningful recording information, including:

- DJ Remix.
- Slow Remix.
- Speed Up.
- Slowed.
- Reverb.
- Nightcore.
- Acoustic.
- Live Version.
- Live Performance.
- Instrumental.
- Karaoke.
- Cover.
- Remastered.
- Original Mix.
- Extended Mix.
- Radio Edit.
- Club Mix.
- Feat. Artist.
- Featuring Artist.
- Duet.
- Remix by Producer.

Remove only the irrelevant promotional parts around these labels.

For example:

Input:
"Nama Artis - Nama Lagu (Slow Remix) FULL ALBUM"

Output:
"Nama Artis - Nama Lagu (Slow Remix).mp3"

Input:
"Nama Artis - Lagu Cinta (Live Version) Official Video 1080p"

Output:
"Nama Artis - Lagu Cinta (Live Version).mp3"

9.7 Artist and Title Extraction

Use this priority:

1. Reliable structured metadata from the configured provider.
2. Explicit artist and title fields.
3. Cleaned source title.
4. Conservative heuristic extraction.

Support common separator patterns:

- "Artist - Title"
- "Title - Artist"
- "Artist | Title"
- "Artist • Title"
- "Artist _ Title"
- "Artist feat. Guest - Title"
- "Artist x Artist - Title"
- "Artist & Artist - Title"

Do not assume the first segment is always the artist.

If identification confidence is low, retain a clean version of the source title without inventing an artist.

9.8 Filename Normalization

Normalize:

- Repeated spaces.
- Empty parentheses and brackets.
- Redundant punctuation.
- Repeated separators.
- Leading and trailing punctuation.
- Zero-width and control characters.
- Filesystem-invalid characters.
- Excessively long filenames.
- Duplicate filenames.

Preserve Unicode, Indonesian characters, and meaningful punctuation.

Preferred filename:

"Artist - Song Title.mp3"

If the artist is unknown:

"Song Title.mp3"

For playlist entries, optionally use:

"001 - Artist - Song Title.mp3"

Use deterministic numbering within each job.

Prevent path traversal and filename collisions.

9.9 Cleaning Modes

Provide three modes:

Standard

- Removes obvious promotional text.
- Uses conservative extraction.

Advanced

- Applies the complete contextual dictionary.
- Extracts artist and title when reliable.
- Normalizes separators.
- Preserves meaningful versions.
- Handles common Indonesian upload patterns.

Custom

- Allows administrators to add removal phrases.
- Allows protected words and phrases.
- Allows filename templates.
- Allows custom separator rules.
- Allows playlist numbering settings.
- Allows language-specific rules.

Advanced must be the default.

Validate custom rules and protect against catastrophic regular-expression performance.

9.10 Cleaner Preview

Before processing, show:

- Original source title.
- Proposed clean title.
- Proposed filename.
- Detected artist, if reliable.
- Detected version, if available.
- Cleaning mode.

For playlists, show the final proposed filenames in each entry.

The cleaning engine must operate in the backend. The UI must display actual backend results, not simulated previews.

9.11 Cleaner Pipeline

Implement the following order:

1. Validate source URL.
2. Retrieve available metadata.
3. Preserve the original source title internally.
4. Normalize Unicode and whitespace.
5. Remove contextual promotional phrases.
6. Remove irrelevant technical labels.
7. Remove upload-year patterns only when justified.
8. Extract artist and title when reliable.
9. Preserve genuine versions.
10. Normalize separators and punctuation.
11. Generate a safe filename.
12. Process permitted audio.
13. Write cleaned embedded metadata where supported.
14. Verify output.
15. Include the result in the download list or ZIP archive.

Do not erase original metadata before retaining the information required for validation and recovery.

10. EMBEDDED AUDIO METADATA

Where supported by the output format, write:

- Title.
- Artist.
- Album, if reliable.
- Album artist, if reliable.
- Track number, when available.
- Genuine release year, when available.
- Genre, when reliable.
- Cover artwork, when legally available and permitted.

Do not use the upload year as the release year.

Do not insert promotional text into the metadata title.

If a field is uncertain, leave it empty rather than inventing a value.

11. REAL-TIME PROGRESS AND JOB QUEUE

Use SSE or an equivalent reliable mechanism to report real backend job states.

Support:

- Job creation.
- URL analysis.
- Metadata retrieval.
- Discovered entry count.
- Queue position.
- Current track.
- Successful track count.
- Failed track count.
- Overall progress.
- Cancellation.
- ZIP creation.
- Final download availability.

Progress must reflect actual backend state.

Implement:

- Configurable concurrency.
- Retry limits for transient failures.
- Per-track status.
- Job cancellation.
- Duplicate-job protection where practical.
- Resource limits.
- Temporary-file expiration.
- Safe recovery after frontend disconnection.

Do not simulate progress percentages.

12. USER INTERFACE

Create the following components:

1. Navigation header and Maxistrong branding.
2. URL submission panel.
3. Track and playlist preview.
4. Audio format selector.
5. Audio quality selector.
6. Cleaner mode selector.
7. Before-and-after title preview.
8. Playlist selection list.
9. Processing queue.
10. Per-track progress.
11. Download results.
12. ZIP export button.
13. Clear error states.
14. Footer and usage information.

On mobile, stack controls vertically and prevent horizontal overflow.

On desktop, show track information and processing status together where appropriate.

All functional controls must be connected to real backend actions.

13. BACKEND API

Implement and document endpoints similar to:

- "POST /api/analyze"
- "POST /api/jobs"
- "GET /api/jobs/:jobId"
- "GET /api/jobs/:jobId/events"
- "POST /api/jobs/:jobId/cancel"
- "GET /api/jobs/:jobId/results"
- "GET /api/files/:fileId"
- "GET /api/health"

Use consistent JSON responses and appropriate HTTP status codes.

Validate all input server-side.

Never expose internal file paths, secrets, stack traces, or unrestricted filesystem access.

14. SECURITY AND RELIABILITY

Implement:

- Strict URL allowlisting.
- SSRF protection.
- Blocking of localhost, private-network, and cloud metadata IP destinations.
- Redirect destination revalidation.
- Rate limiting.
- Maximum playlist size.
- Maximum file size and processing duration.
- Safe temporary directories.
- Filename sanitization.
- Secure download authorization.
- Strict CORS.
- Security headers.
- Input validation.
- Structured logging.
- Graceful shutdown.
- Automatic cleanup.
- Protection against resource exhaustion.

Never construct shell commands from user-controlled strings.

Use safe process spawning with fixed executable paths and validated argument arrays.

Do not bypass source access restrictions.

15. CONFIGURATION

Provide ".env.example" with documented settings for:

- Backend port.
- Frontend URL.
- Temporary storage directory.
- Maximum concurrent jobs.
- Maximum playlist entries.
- Maximum processing duration.
- Temporary-file expiration.
- Optional provider credentials.
- Logging level.

Never commit real secrets.

16. TESTING

Create automated tests for:

- URL validation.
- Playlist recognition.
- Mix recognition.
- Unsupported URLs.
- Single-track processing.
- Quality validation.
- Output format validation.
- Cleaner dictionary rules.
- Artist and title extraction.
- Promotional year removal.
- Preservation of remix and live labels.
- Unicode filenames.
- Duplicate filenames.
- Playlist numbering.
- Embedded metadata.
- ZIP contents.
- Failed playlist entries.
- Queue concurrency.
- Cancellation.
- SSE progress.
- Temporary-file cleanup.
- SSRF protection.
- Unauthorized file access.

Use mock providers for automated tests so the test suite does not depend on live YouTube availability.

Maintain a representative multilingual title-cleaning corpus. Test false positives as well as successful removals.

17. DEPLOYMENT

Provide Linux VPS deployment instructions covering:

- Supported Node.js version.
- Dependency installation.
- Environment configuration.
- Frontend production build.
- Backend startup.
- Reverse proxy.
- HTTPS.
- Process supervision.
- Log inspection.
- Storage monitoring.
- Graceful shutdown.
- Temporary-file cleanup.
- Troubleshooting.

Use PM2 or an equivalent process manager when appropriate.

Document CPU, memory, and storage requirements for batch jobs.

18. PROJECT STRUCTURE

Use a maintainable structure such as:

maxistrong/

- frontend/
  - app/
  - components/
  - hooks/
  - lib/
- backend/
  - src/
    - app.js
    - server.js
    - routes/
    - controllers/
    - services/
    - providers/
    - queue/
    - jobs/
    - cleaner/
    - metadata/
    - middleware/
    - validators/
    - storage/
    - utils/
  - tests/
- shared/
- .env.example
- .gitignore
- README.md

Adjust the structure where necessary, but keep the cleaner, provider integrations, queue, and metadata processing modular.

19. IMPLEMENTATION WORKFLOW

Work in phases:

Phase 1: Inspect the existing repository.

Phase 2: Build frontend and backend foundations.

Phase 3: Implement URL validation and provider abstractions.

Phase 4: Implement metadata analysis.

Phase 5: Implement the title-cleaning engine and tests.

Phase 6: Implement output format and audio quality selection.

Phase 7: Implement the processing queue and progress events.

Phase 8: Implement playlist handling.

Phase 9: Implement best-effort Mix recognition.

Phase 10: Implement authorized audio processing and metadata writing.

Phase 11: Implement ZIP export and temporary-file cleanup.

Phase 12: Complete the responsive Maxistrong interface.

Phase 13: Implement security controls and automated tests.

Phase 14: Verify the production build and document VPS deployment.

Do not skip tests or replace unfinished backend features with decorative controls.

20. FINAL ACCEPTANCE CRITERIA

The project is complete only when:

- Maxistrong branding is consistent throughout the application.
- The application starts using documented commands.
- The frontend and backend communicate correctly.
- Supported URLs are analyzed correctly.
- Playlist entries are displayed and processed independently.
- Mix limitations are handled transparently.
- Users can choose supported audio formats and quality settings.
- Actual output encoding is validated.
- Titles are automatically cleaned before file creation.
- Promotional labels are removed contextually.
- Meaningful song versions are preserved.
- Artist names are not blindly inferred from channel names.
- Embedded metadata is cleaned when supported.
- ZIP files contain separate, correctly named tracks.
- Progress reflects real backend states.
- Failed entries do not unnecessarily stop the entire batch.
- Cancellation and cleanup work.
- Security tests pass.
- The production build succeeds.
- Deployment and troubleshooting documentation is complete.

Final instruction to the coding agent:

Inspect the repository before making changes. Implement the actual working application incrementally. Preserve all existing functionality while integrating every requirement in this specification. Do not generate a UI-only prototype, fake download results, simulated progress, or unsupported quality options. Explain provider limitations honestly, validate each feature with tests, and document any functionality that cannot be completed with the available authorized sources.