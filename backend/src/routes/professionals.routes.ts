import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { tenantMiddleware, TenantRequest } from '../middlewares/tenant.middleware';
import {
  createProfessional,
  listProfessionals,
  getProfessional,
  updateProfessional,
  deleteProfessional,
} from '../controllers/professionals.controller';

const router = Router();

function wrap(fn: (req: TenantRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as TenantRequest, res).catch(next);
  };
}

router.use(authMiddleware);
router.use((req, res, next) => tenantMiddleware(req as any, res, next));

router.get('/',      wrap(listProfessionals));
router.get('/:id',   wrap(getProfessional));
router.post('/',     wrap(createProfessional));
router.put('/:id',   wrap(updateProfessional));
router.delete('/:id', wrap(deleteProfessional));

export default router;
