/**
 * Base Provider Adapter Abstract Contract
 */

export class BaseProviderAdapter {
  constructor(name) {
    this.name = name;
  }

  async analyzeUrl(urlInfo) {
    throw new Error('analyzeUrl() must be implemented by provider adapter');
  }

  async fetchTrackStream(videoId, qualityOptions) {
    throw new Error('fetchTrackStream() must be implemented by provider adapter');
  }
}
