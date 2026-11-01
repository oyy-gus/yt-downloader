export abstract class BaseProviderAdapter {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  abstract analyzeUrl(urlInfo: any): Promise<any>;
}
