const knex = require('../src/config/connection');
const outbox = require('../src/services/outboxService');

let tenantId;

beforeEach(async () => {
    await knex('delivery_outbox').del();
    await knex('tenants').where({ slug: 'outbox-test' }).del();
    [{ id: tenantId }] = await knex('tenants')
        .insert({ name: 'Outbox Test', slug: 'outbox-test', status: 'ATIVO' })
        .returning('id');
});

test('payload sensível é criptografado e recuperável somente pelo worker', async () => {
    const payload = { recipient: 'synthetic@example.test', resetToken: 'synthetic-reset-token' };
    await outbox.enqueue({ tenantId, eventType: 'PASSWORD_RESET', payload });
    const row = await knex('delivery_outbox').where({ tenant_id: tenantId }).first();
    expect(row.encrypted_payload).not.toContain(payload.recipient);
    expect(row.encrypted_payload).not.toContain(payload.resetToken);
    expect(outbox.decrypt(row.encrypted_payload)).toEqual(payload);
});

test('rollback do workflow não deixa evento órfão', async () => {
    await expect(knex.transaction(async (trx) => {
        await outbox.enqueue({
            tenantId,
            eventType: 'NOTIFICATION_APPROVED',
            payload: { notificationId: 'synthetic' },
            transaction: trx
        });
        throw new Error('synthetic rollback');
    })).rejects.toThrow('synthetic rollback');
    expect(await knex('delivery_outbox').where({ tenant_id: tenantId })).toHaveLength(0);
});
