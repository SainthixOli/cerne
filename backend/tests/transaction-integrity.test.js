const knex = require('../src/config/connection');
const repository = require('../src/repositories/affiliationRepository');
const uploadGrant = require('../src/services/uploadGrant');
const reviewService = require('../src/services/affiliationReviewService');
const transferService = require('../src/services/affiliationTransferService');
const affiliationController = require('../src/controllers/affiliationController');

describe('Phase 2 atomic affiliation operations', () => {
    let tenantId;

    beforeEach(async () => {
        for (const table of ['filiation_chat', 'affiliation_upload_tokens', 'filiacoes', 'profiles', 'tenants']) {
            await knex(table).delete();
        }
        [{ id: tenantId }] = await knex('tenants')
            .insert({ name: 'Atomic Tenant', slug: 'atomic-tenant' })
            .returning('id');
        await knex('profiles').insert([
            { id: 'atomic-member', tenant_id: tenantId, nome_completo: 'Member', cpf: '92000000001', email: 'member@example.test', role: 'professor', status_conta: 'em_analise' },
            { id: 'atomic-admin', tenant_id: tenantId, nome_completo: 'Admin', cpf: '92000000002', email: 'admin@example.test', role: 'admin', status_conta: 'ativo' },
            { id: 'atomic-target', tenant_id: tenantId, nome_completo: 'Target', cpf: '92000000003', email: 'target@example.test', role: 'admin', status_conta: 'ativo' }
        ]);
        await knex('filiacoes').insert({
            id: 7001, tenant_id: tenantId, user_id: 'atomic-member', protocolo: 'ATOMIC-1',
            status: 'em_processamento', status_atendimento: 'aberto'
        });
    });

    test('registration failure rolls back profile, affiliation and upload grant', async () => {
        jest.spyOn(uploadGrant, 'issue').mockRejectedValueOnce(new Error('simulated grant failure'));
        const req = {
            tenantId,
            body: { nome: 'New Member', cpf: '92000000004', email: 'new@example.test' }
        };
        const res = {
            statusCode: 200,
            headers: {},
            setHeader(name, value) { this.headers[name] = value; },
            status(code) { this.statusCode = code; return this; },
            json(payload) { this.body = payload; return this; }
        };
        await affiliationController.register(req, res);
        expect(res.statusCode).toBe(500);
        expect(await knex('profiles').where({ cpf: '92000000004', tenant_id: tenantId }).first()).toBeUndefined();
        expect(Number((await knex('filiacoes').where({ protocolo: 'ATOMIC-1' })
            .count({ total: '*' }).first()).total)).toBe(1);
    });

    test('approval failure rolls back account activation', async () => {
        jest.spyOn(repository, 'markAffiliationApproved').mockRejectedValueOnce(new Error('simulated approval failure'));
        await expect(reviewService.approveAffiliation({
            affiliationId: 7001, adminId: 'atomic-admin', tenantId, observacoes: 'test'
        })).rejects.toThrow('simulated approval failure');
        expect((await knex('profiles').where({ id: 'atomic-member' }).first()).status_conta).toBe('em_analise');
        expect((await knex('filiacoes').where({ id: 7001 }).first()).status).toBe('em_processamento');
    });

    test('rejection failure rolls back all previous updates', async () => {
        jest.spyOn(repository, 'addAffiliationChatMessage').mockRejectedValueOnce(new Error('simulated chat failure'));
        await expect(reviewService.rejectAffiliation({
            affiliationId: 7001, adminId: 'atomic-admin', tenantId, observacoes: 'test'
        })).rejects.toThrow('simulated chat failure');
        expect((await knex('profiles').where({ id: 'atomic-member' }).first()).status_conta).toBe('em_analise');
        expect((await knex('filiacoes').where({ id: 7001 }).first()).status).toBe('em_processamento');
    });

    test('transfer failure rolls back assignee and chat together', async () => {
        await knex('filiacoes').where({ id: 7001 }).update({ responsavel_admin_id: 'atomic-admin' });
        jest.spyOn(repository, 'addAffiliationChatMessage').mockRejectedValueOnce(new Error('simulated chat failure'));
        await expect(transferService.transferAffiliation({
            affiliationId: 7001,
            targetAdminId: 'atomic-target',
            requesterId: 'atomic-admin',
            requesterRole: 'super_admin',
            tenantId
        })).rejects.toThrow('simulated chat failure');
        expect((await knex('filiacoes').where({ id: 7001 }).first()).responsavel_admin_id).toBe('atomic-admin');
        expect(await knex('filiation_chat').where({ filiacao_id: 7001 })).toHaveLength(0);
    });
});
