import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes         from './routes/auth.routes';
import patientsRoutes     from './routes/patients.routes';
import consultasRoutes    from './routes/consultas.routes';
import professionalsRoutes from './routes/professionals.routes';
import settingsRoutes     from './routes/settings.routes';
import adminRoutes        from './routes/admin.routes';
import { globalBackpressure }       from './middlewares/backpressure';
import { correlationIdMiddleware }  from './middlewares/correlationId';
import { errorHandler }             from './middlewares/errorHandler';
import { tenantConcurrency }        from './middlewares/tenantConcurrency';
import { tenantCircuitBreaker }     from './middlewares/circuitBreaker';
import { requestLogger }            from './middlewares/logger';
import { tenantContextMiddleware }  from './middlewares/tenant';

const app = express();

// ─── Segurança: headers HTTP ──────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'"],
      objectSrc:  ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin ?? '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key, X-Correlation-ID');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  next();
});

// ─── Rate limit em rotas de autenticação ──────────────────────────────────────
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests', retry_after: '15 minutes' },
  skip: () => process.env.NODE_ENV === 'test',
});

// ─── Pipeline de middlewares ──────────────────────────────────────────────────
app.use(correlationIdMiddleware);
app.use(requestLogger);
app.use(globalBackpressure);
app.use(express.json({ limit: '1mb' }));
app.use(tenantContextMiddleware);
app.use(tenantCircuitBreaker);
app.use(tenantConcurrency);

// ─── Rotas ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth',          authRateLimit, authRoutes);
app.use('/patients',      patientsRoutes);
app.use('/consultas',     consultasRoutes);
app.use('/professionals', professionalsRoutes);
app.use('/settings',      settingsRoutes);
app.use('/admin',         adminRoutes);

app.use(errorHandler);

export default app;
