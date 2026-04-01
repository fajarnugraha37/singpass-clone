import { Hono } from 'hono';
import { QRAuthService } from '../../../core/services/qr_auth_service';
import * as controller from '../controllers/singpass-qr.controller';

export const createSingpassQRRouter = (service: QRAuthService) => {
  const router = new Hono()
  .post('/qr/init', controller.initQR(service))
  .get('/qr/status/:sessionId', controller.getQRStatus(service))
  .get('/callback', controller.singpassCallback(service));

  return router;
};
