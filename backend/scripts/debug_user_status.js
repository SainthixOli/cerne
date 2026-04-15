
const { getDb } = require('../src/config/database');

async function checkUserStatus() {
    try {
        const db = await getDb();
        console.log('Checking profiles for Amanda...');

        // Find Amanda's CPF
        const user = await db.get("SELECT * FROM profiles WHERE nome_completo LIKE '%Amanda ribeiro sem mae%'");
        if (!user) {
            console.log("User not found via name search.");
            return;
        }

        console.log('User found:', user.nome_completo, 'CPF:', user.cpf, 'Status:', user.status_conta);

        const rows = await db.all(`
            SELECT id, status, data_solicitacao 
            FROM filiacoes 
            WHERE user_id = ? 
            ORDER BY data_solicitacao DESC
        `, [user.id]);

        console.log('All requests:', JSON.stringify(rows, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

checkUserStatus();
