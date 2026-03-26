import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { tenantMiddleware } from '../middlewares/tenant.middleware';
import { createPatient, listPatients, getPatient } from '../controllers/patients.controller';
import { TenantRequest } from '../middlewares/tenant.middleware';
import { idempotencyMiddleware } from '../middlewares/idempotency.middleware';

const router = Router();

type TenantHandler = (req: TenantRequest, res: Response) => Promise<void>;

function wrap(fn: TenantHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as TenantRequest, res).catch(next);
  };
}

router.use(authMiddleware);
router.use((req, res, next) => tenantMiddleware(req as any, res, next));

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  idempotencyMiddleware(req as TenantRequest, res, next).catch(next);
}, wrap(createPatient));
router.get('/', wrap(listPatients));
router.get('/:id', wrap(getPatient));

export default router;
