// This additive guard intentionally sorts before the legacy 20260518 migration, which
// assigned every tenant-less audit row to tenant 1. Only an authoritative admin profile
// may determine the tenant; ambiguous/orphan rows stop the migration for manual review.
exports.up = async function up(knex) {
    const rows = await knex('audit_logs').select('id', 'admin_id').whereNull('tenant_id');
    const updates = [];
    let ambiguous = 0;

    for (const row of rows) {
        if (!row.admin_id) {
            ambiguous += 1;
            continue;
        }
        const profiles = await knex('profiles').select('tenant_id').where({ id: row.admin_id });
        const tenants = [...new Set(profiles.map((profile) => profile.tenant_id).filter(Boolean).map(Number))];
        if (tenants.length !== 1) ambiguous += 1;
        else updates.push({ id: row.id, tenantId: tenants[0] });
    }

    if (ambiguous > 0) {
        throw new Error(`PHASE2_MANUAL_REVIEW: audit_logs contains ${ambiguous} row(s) without one authoritative tenant`);
    }
    for (const update of updates) {
        await knex('audit_logs').where({ id: update.id }).update({ tenant_id: update.tenantId });
    }
};

// A verified tenant assignment is authoritative data and is intentionally retained.
exports.down = async function down() {};
