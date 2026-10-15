process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://test:test@127.0.0.1:5432/healthflow_test';
process.env.JWT_SECRET ??= 'test-only-jwt-secret-not-for-production';