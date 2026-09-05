const { getDb } = require('../src/config/database');
const { requireScriptEnv } = require('./scriptEnv');

async function checkUserStatus() {
    try {
        const db = await getDb();
        const userId = requireScriptEnv('CERNE_DEBUG_USER_ID');
        const user = await db.get(
            'SELECT id, status_conta FROM profiles WHERE id = ?',
            [userId]
        );

        if (!user) {
            console.log('User not found.');
            return;
        }

        console.log('User found; account status:', user.status_conta);

        const rows = await db.all(`
            SELECT id, status, data_solicitacao
            FROM filiacoes
            WHERE user_id = ?
            ORDER BY data_solicitacao DESC
        `, [user.id]);

        console.log('Affiliation request count:', rows.length);
    } catch (error) {
        console.error('Error:', error.message);
        process.exitCode = 1;
    }
}

checkUserStatus();
