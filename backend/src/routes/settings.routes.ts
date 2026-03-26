import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { tenantMiddleware, TenantRequest } from '../middlewares/tenant.middleware';
import { getSettings, updateSettings } from '../controllers/settings.controller';

const router = Router();

function wrap(fn: (req: TenantRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as TenantRequest, res).catch(next);
  };
}

router.use(authMiddleware);
router.use((req, res, next) => tenantMiddleware(req as any, res, next));

router.get('/',  wrap(getSettings));
router.put('/',  wrap(updateSettings));

export default router;
