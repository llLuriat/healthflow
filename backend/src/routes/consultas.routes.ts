import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { tenantMiddleware, TenantRequest } from '../middlewares/tenant.middleware';
import {
  createConsulta,
  listConsultas,
  getConsulta,
  updateConsultaEstado,
  deleteConsulta,
} from '../controllers/consultas.controller';
import { idempotencyMiddleware } from '../middlewares/idempotency.middleware';

const router = Router();

function wrap(fn: (req: TenantRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as TenantRequest, res).catch(next);
  };
}

// Garante: JWT válido obrigatório → tenant isolado na transação
// Ordem correta: authMiddleware ANTES de tenantMiddleware (auditoria NC1)
router.use(authMiddleware);
router.use((req, res, next) => tenantMiddleware(req as any, res, next));

router.post(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    idempotencyMiddleware(req as TenantRequest, res, next).catch(next);
  },
  wrap(createConsulta)
);

router.get('/', wrap(listConsultas));
router.get('/:id', wrap(getConsulta));
router.patch('/:id/estado', wrap(updateConsultaEstado));
router.delete('/:id', wrap(deleteConsulta));

export default router;
