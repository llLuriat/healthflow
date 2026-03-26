import request from 'supertest';
import app from '../app';

describe('GET /health', () => {
  it('retorna status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('Rotas protegidas — sem token', () => {
  it.each(['/patients', '/consultas', '/professionals', '/settings'])(
    '%s → 401',
    async (route) => {
      const res = await request(app).get(route);
      expect(res.status).toBe(401);
    },
  );
});

describe('POST /auth/register — validações', () => {
  it('body vazio → 400', async () => {
    const res = await request(app).post('/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('email inválido → 400', async () => {
    const res = await request(app).post('/auth/register').send({
      tenantName: 'Clínica Teste',
      email: 'invalido',
      password: 'senha1234',
    });
    expect(res.status).toBe(400);
  });

  it('senha curta → 400', async () => {
    const res = await request(app).post('/auth/register').send({
      tenantName: 'Clínica Teste',
      email: 'teste@clinica.com',
      password: '123',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login — validações', () => {
  it('tenantId inválido → 401', async () => {
    const res = await request(app).post('/auth/login').send({
      tenantId: 'nao-e-uuid',
      email: 'teste@clinica.com',
      password: 'senha1234',
    });
    expect(res.status).toBe(401);
  });

  it('body vazio → 400', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login-by-email — validações', () => {
  it('email inválido → 400', async () => {
    const res = await request(app).post('/auth/login-by-email').send({
      email: 'invalido',
      password: 'senha1234',
    });
    expect(res.status).toBe(400);
  });

  it('credenciais inexistentes → 401', async () => {
    const res = await request(app).post('/auth/login-by-email').send({
      email: 'inexistente_xyz@healthflow.test',
      password: 'qualquersenha',
    });
    expect(res.status).toBe(401);
  });
});

describe('POST /admin/login — validações', () => {
  it('email inválido → 400', async () => {
    const res = await request(app).post('/admin/login').send({
      email: 'invalido',
      password: 'senha1234',
    });
    expect(res.status).toBe(400);
  });

  it('credenciais inexistentes → 401', async () => {
    const res = await request(app).post('/admin/login').send({
      email: 'admin_inexistente@healthflow.test',
      password: 'qualquersenha',
    });
    expect(res.status).toBe(401);
  });
});

describe('Admin routes — sem token', () => {
  it.each(['/admin/stats', '/admin/clients'])('%s → 401', async (route) => {
    const res = await request(app).get(route);
    expect(res.status).toBe(401);
  });
});
