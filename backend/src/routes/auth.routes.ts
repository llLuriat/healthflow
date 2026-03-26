import { Router } from 'express';
import { register, login, loginByEmail } from '../controllers/auth.controller';

const router = Router();

router.post('/register',        (req, res, next) => { register(req, res).catch(next); });
router.post('/login',           (req, res, next) => { login(req, res).catch(next); });
// Login simplificado: apenas email + senha (sem tenantId explícito)
router.post('/login-by-email',  (req, res, next) => { loginByEmail(req, res).catch(next); });

export default router;
