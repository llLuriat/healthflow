## HealthFlow

### Idempotência
- **Header recomendado**: `Idempotency-Key`
- **Header compatível**: `x-idempotency-key`
- **TTL padrão**: 24h (`IDEMPOTENCY_TTL_MS` opcional)
- **Persistência**: respostas `< 500` são armazenadas; erros `>= 500` não são persistidos
- **Conflitos**:
  - no fluxo principal, respostas existentes são retornadas se não expiradas
  - algumas rotas podem aplicar `409 idempotency_key_mismatch` quando `request_hash` diverge

### Segurança de tenant (produção)
Em produção (`NODE_ENV=production`), o processo falha no startup se `ENABLE_UNSAFE_TENANT` não for `false`.

