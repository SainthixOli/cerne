const { getDb } = require('../src/config/database');
const bcrypt = require('bcrypt');

async function resetAdmin() {
    try {
        const db = await getDb();
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Update the existing admin or create if not exists
        const adminCpf = '000.000.000-00';

        const existing = await db.get('SELECT id FROM profiles WHERE cpf = ?', [adminCpf]);

        if (existing) {
            await db.run('UPDATE profiles SET password_hash = ?, change_password_required = 0 WHERE cpf = ?', [hashedPassword, adminCpf]);
            console.log('Admin password updated to: admin123');
        } else {
            console.log('Admin user not found to update.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

resetAdmin();
