const { getDb } = require('../src/config/database');
const bcrypt = require('bcrypt');
const { requireScriptEnv } = require('./scriptEnv');

async function resetAdmin() {
    try {
        const db = await getDb();
        const password = requireScriptEnv('CERNE_ADMIN_PASSWORD', { minLength: 12, secret: true });
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the existing admin or create if not exists
        const adminCpf = requireScriptEnv('CERNE_ADMIN_CPF');

        const existing = await db.get('SELECT id FROM profiles WHERE cpf = ?', [adminCpf]);

        if (existing) {
            await db.run('UPDATE profiles SET password_hash = ?, change_password_required = 0 WHERE cpf = ?', [hashedPassword, adminCpf]);
            console.log('Admin password updated successfully.');
        } else {
            console.log('Admin user not found to update.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

resetAdmin();
