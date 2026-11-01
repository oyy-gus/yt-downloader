import { BaseProviderAdapter } from './adapter.js';

export class MockProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super('MockProvider (Dev Mode)');
  }

  async analyzeUrl(urlInfo: any): Promise<any> {
    await new Promise(res => setTimeout(res, 400));

    if (urlInfo.type === 'playlist') {
      return {
        isDemo: true,
        type: 'playlist',
        title: 'Top Hits Indonesian & Global Mix (Demo Playlist)',
        channel: 'Maxistrong Music Hub',
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        totalEntries: 4,
        entries: [
          {
            id: 'demo-1',
            title: 'LAGU TERBARU 2026!! Budi Doremi - Melukis Senja (Official Music Video) HD',
            artist: 'Budi Doremi',
            channel: 'Budi Doremi Official',
            durationSec: 240,
            thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
            url: 'https://www.youtube.com/watch?v=demo-1'
          },
          {
            id: 'demo-2',
            title: 'DJ JAWA FULL ALBUM TERBARU 2026 - Denok - Ajeng Febria (Official Video)',
            artist: 'Ajeng Febria',
            channel: 'Dangdut Koplo Official',
            durationSec: 310,
            thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
            url: 'https://www.youtube.com/watch?v=demo-2'
          },
          {
            id: 'demo-3',
            title: 'Nama Artis - Nama Lagu (Slow Remix) FULL ALBUM 1080P',
            artist: 'Nama Artis',
            channel: 'Remix Station',
            durationSec: 215,
            thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&auto=format&fit=crop&q=80',
            url: 'https://www.youtube.com/watch?v=demo-3'
          },
          {
            id: 'demo-4',
            title: 'Coldplay - Fix You (Official Live Video) 4K',
            artist: 'Coldplay',
            channel: 'Coldplay Official',
            durationSec: 295,
            thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
            url: 'https://www.youtube.com/watch?v=demo-4'
          }
        ]
      };
    }

    if (urlInfo.type === 'mix') {
      return {
        isDemo: true,
        type: 'mix',
        title: 'YouTube Mix - Recommended Tracks',
        channel: 'YouTube Auto Mix',
        thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
        totalEntries: 3,
        entries: [
          {
            id: 'mix-1',
            title: 'Sheila On 7 - Dan (Official Audio)',
            artist: 'Sheila On 7',
            channel: 'Sheila On 7 Channel',
            durationSec: 280,
            thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
            url: 'https://www.youtube.com/watch?v=mix-1'
          },
          {
            id: 'mix-2',
            title: 'Adele - Someone Like You (Official Music Video)',
            artist: 'Adele',
            channel: 'AdeleVEVO',
            durationSec: 285,
            thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
            url: 'https://www.youtube.com/watch?v=mix-2'
          },
          {
            id: 'mix-3',
            title: 'Denny Caknan - Kartonyono Medot Janji (Official Music Video) HD',
            artist: 'Denny Caknan',
            channel: 'Denny Caknan Official',
            durationSec: 320,
            thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&auto=format&fit=crop&q=80',
            url: 'https://www.youtube.com/watch?v=mix-3'
          }
        ]
      };
    }

    const videoId = urlInfo.videoId || 'single-demo';
    return {
      isDemo: true,
      type: 'track',
      title: 'Tulus - Hati-Hati di Jalan (Official Music Video)',
      channel: 'Tulus Music',
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      totalEntries: 1,
      entries: [
        {
          id: videoId,
          title: 'Tulus - Hati-Hati di Jalan (Official Music Video)',
          artist: 'Tulus',
          composer: 'Tulus',
          channel: 'Tulus Music',
          durationSec: 242,
          thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
          url: urlInfo.normalizedUrl
        }
      ]
    };
  }
}
