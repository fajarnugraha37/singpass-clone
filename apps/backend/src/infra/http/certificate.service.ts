import * as selfsigned from 'selfsigned';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { logger } from '../../utils/logger';

export interface CertificateConfig {
  dir: string;
  keyFile: string;
  certFile: string;
  days?: number;
}

export class CertificateService {
  private config: CertificateConfig;

  constructor(config: Partial<CertificateConfig> = {}) {
    this.config = {
      dir: config.dir || path.join(process.cwd(), '.ssl'),
      keyFile: config.keyFile || 'server.key',
      certFile: config.certFile || 'server.crt',
      days: config.days || 365,
    };
  }

  /**
   * Ensures certificates exist, generating them if necessary.
   */
  public async ensureCertificates(): Promise<{ key: string; cert: string }> {
    const keyPath = path.join(this.config.dir, this.config.keyFile);
    const certPath = path.join(this.config.dir, this.config.certFile);

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      logger.info('Using existing TLS certificates from .ssl/');
      return {
        key: fs.readFileSync(keyPath, 'utf-8'),
        cert: fs.readFileSync(certPath, 'utf-8'),
      };
    }

    logger.info('TLS certificates missing. Generating self-signed certificates...');
    
    if (!fs.existsSync(this.config.dir)) {
      fs.mkdirSync(this.config.dir, { recursive: true });
    }

    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const pems = await selfsigned.generate(attrs, {
      algorithm: 'sha256',
      notAfterDate: new Date(Date.now() + (this.config.days || 365) * 24 * 60 * 60 * 1000),
      keySize: 2048,
      extensions: [{
        name: 'subjectAltName',
        altNames: [{ type: 2, value: 'localhost' }, { type: 7, ip: '127.0.0.1' }]
      }]
    });

    fs.writeFileSync(keyPath, pems.private, 'utf-8');
    fs.writeFileSync(certPath, pems.cert, 'utf-8');

    logger.info(`Generated self-signed certificate in ${this.config.dir}`);

    return {
      key: pems.private,
      cert: pems.cert,
    };
  }

  /**
   * Checks if certificates exist and are valid PEM files.
   */
  public validateCertificates(): boolean {
    const keyPath = path.join(this.config.dir, this.config.keyFile);
    const certPath = path.join(this.config.dir, this.config.certFile);
    
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      return false;
    }

    try {
      const key = fs.readFileSync(keyPath, 'utf-8');
      const cert = fs.readFileSync(certPath, 'utf-8');
      
      return (
        key.includes('-----BEGIN PRIVATE KEY-----') &&
        cert.includes('-----BEGIN CERTIFICATE-----')
      );
    } catch (error) {
      logger.error('Error validating certificates', error);
      return false;
    }
  }
}
