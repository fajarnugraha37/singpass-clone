import { ServerFactory } from './server.factory';

export interface HttpRedirectServerConfig {
  port: number;
}

export class HttpRedirectServer {
  constructor(private config: HttpRedirectServerConfig) {}

  public start() {
    return ServerFactory.createServer({
      port: this.config.port,
      fetch: (request: Request) => {
        const url = new URL(request.url);
        url.protocol = 'https:';
        url.port = '443';
        return Response.redirect(url.toString(), 301);
      },
    });
  }
}
