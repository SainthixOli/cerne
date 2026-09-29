exports.up = async function (knex) {
    await knex.raw(`
        CREATE FUNCTION guard_assigned_technical_admin() RETURNS trigger AS $$
        BEGIN
            IF EXISTS (SELECT 1 FROM tenants tenant WHERE tenant.technical_admin_id = OLD.id) THEN
                IF TG_OP = 'DELETE' OR NEW.id IS DISTINCT FROM OLD.id
                   OR NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
                   OR NEW.role IS DISTINCT FROM 'system_manager' THEN
                    RAISE EXCEPTION 'profile is an assigned technical admin';
                END IF;
            END IF;
            RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER guard_technical_admin_update
        BEFORE UPDATE OF id, tenant_id, role ON profiles
        FOR EACH ROW EXECUTE FUNCTION guard_assigned_technical_admin();

        CREATE TRIGGER guard_technical_admin_delete
        BEFORE DELETE ON profiles
        FOR EACH ROW EXECUTE FUNCTION guard_assigned_technical_admin();
    `);
};

exports.down = async function (knex) {
    await knex.raw('DROP TRIGGER IF EXISTS guard_technical_admin_delete ON profiles');
    await knex.raw('DROP TRIGGER IF EXISTS guard_technical_admin_update ON profiles');
    await knex.raw('DROP FUNCTION IF EXISTS guard_assigned_technical_admin()');
};
