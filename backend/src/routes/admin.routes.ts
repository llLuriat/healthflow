import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { adminLogin, getAdminStats, listClients } from '../controllers/admin.controller';
import { adminAuthMiddleware } from '../middlewares/admin.middleware';

const router = Router();

const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});

router.post('/login', adminRateLimit, (req, res, next) => {
  adminLogin(req, res).catch(next);
});

router.get('/stats',   adminAuthMiddleware, (req, res, next) => {
  getAdminStats(req, res).catch(next);
});

router.get('/clients', adminAuthMiddleware, (req, res, next) => {
  listClients(req, res).catch(next);
});

export default router;
