import { ServerFactory } from './server.factory';

export interface HttpsServerConfig {
  port: number;
  fetch: (request: Request) => Response | Promise<Response>;
  tls: {
    key: string;
    cert: string;
  };
}

export class HttpsServer {
  constructor(private config: HttpsServerConfig) {}

  public start() {
    return ServerFactory.createServer({
      port: this.config.port,
      fetch: this.config.fetch,
      tls: this.config.tls,
    });
  }
}
