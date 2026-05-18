/**
 * Migration: Fix orphaned audit_logs (no tenant_id)
 * 
 * Esses logs foram criados antes da FASE 2 ser implementada.
 * Vamos atribuir tenant_id = 1 (tenant padrão) para todos os logs órfãos.
 */

exports.up = function (knex) {
    return knex.raw(`
        UPDATE audit_logs 
        SET tenant_id = 1 
        WHERE tenant_id IS NULL
    `);
};

exports.down = function (knex) {
    return knex.raw(`
        UPDATE audit_logs 
        SET tenant_id = NULL 
        WHERE tenant_id = 1 AND admin_id IN (
            SELECT DISTINCT admin_id FROM audit_logs WHERE tenant_id IS NULL
        )
    `);
};
