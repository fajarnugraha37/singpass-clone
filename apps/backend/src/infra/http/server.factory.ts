import { logger } from '../../utils/logger';

export interface ServerOptions {
  port: number;
  fetch: (request: Request) => Response | Promise<Response>;
  tls?: {
    key: string;
    cert: string;
  };
}

export class ServerFactory {
  /**
   * Creates and starts a Bun server.
   */
  public static createServer(options: ServerOptions) {
    const { port, fetch, tls } = options;

    try {
      const server = Bun.serve({
        port,
        fetch,
        tls,
      });

      logger.info(`${tls ? 'HTTPS' : 'HTTP'} server started on port ${port}`);
      return server;
    } catch (error) {
      logger.error(`Failed to start ${tls ? 'HTTPS' : 'HTTP'} server on port ${port}`, error);
      throw error;
    }
  }
}
