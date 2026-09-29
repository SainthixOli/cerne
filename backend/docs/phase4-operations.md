# Operação da Fase 4

## Sessão e origens

- O frontend usa somente a sessão autoritativa retornada por `GET /api/auth/session`.
- A credencial de sessão fica em cookie `HttpOnly`, `SameSite=Strict` e `Secure` em produção. O frontend não lê JWT nem função do `localStorage`.
- A resposta de login não expõe o JWT por padrão. `LEGACY_BEARER_TOKEN_RESPONSE=true` existe apenas como ponte temporária para clientes não-web e deve ser removida após sua migração.
- Frontend e API devem ser publicados no mesmo site registrável. Se isso não for possível, a política de cookie e a proteção CSRF precisam ser redesenhadas antes do deploy.
- `CORS_ORIGIN` deve conter apenas as origens efetivamente publicadas.

## Documentos privados

- `OBJECT_STORAGE_DRIVER=supabase` é obrigatório fora de testes.
- `OBJECT_STORAGE_BUCKET` deve apontar para um bucket privado; a chave usada pelo backend nunca deve ser exposta ao navegador.
- Downloads passam pelos endpoints autenticados do backend, que validam tenant e propriedade antes de fazer streaming.
- Registros antigos que ainda guardem caminhos do disco não são servidos. Antes de remover o volume legado, importe-os para o bucket privado, atualize somente as chaves opacas no banco e reconcilie contagem, tamanho e hash.

## Outbox e worker

- Eventos de senha e reset são gravados na mesma transação da alteração de negócio em `delivery_outbox`.
- O payload é cifrado com `OUTBOX_ENCRYPTION_KEY`, que deve ser independente do `JWT_SECRET`.
- O worker roda dentro do monólito quando `OUTBOX_WORKER_ENABLED=true` e usa bloqueio `SKIP LOCKED`, permitindo mais de uma instância sem entrega concorrente do mesmo lote.
- Monitore eventos pendentes antigos, tentativas e `last_error_code`. A rotação da chave da outbox exige plano de recifragem dos eventos ainda não processados.

## Health checks

- Liveness: `GET /api/health/live` verifica apenas o processo.
- Readiness: `GET /api/health/ready` verifica a conexão PostgreSQL e retorna 503 quando indisponível.
- O orquestrador deve retirar instâncias não prontas do balanceamento sem reiniciá-las por uma indisponibilidade transitória do banco.

## Escala

Redis não é requisito para uma única instância. Adote-o quando houver múltiplas réplicas e for necessário compartilhar rate limiting, cache ou uma fila de maior volume. Até lá, PostgreSQL permanece como fonte durável da outbox e do estado operacional.
