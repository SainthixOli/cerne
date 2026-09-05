const { getDb } = require('../src/config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { requireScriptEnv } = require('./scriptEnv');

async function seedProfessor() {
    try {
        const db = await getDb();
        const password = requireScriptEnv('CERNE_PROFESSOR_PASSWORD', { minLength: 12, secret: true });
        const cpf = requireScriptEnv('CERNE_PROFESSOR_CPF');
        const email = requireScriptEnv('CERNE_PROFESSOR_EMAIL');
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();

        await db.run(
            `INSERT INTO profiles (id, nome_completo, cpf, email, role, status_conta, password_hash)
       VALUES (?, 'Professor Teste', ?, ?, 'professor', 'ativo', ?)`,
            [id, cpf, email, hashedPassword]
        );

        console.log('Professor user created successfully!');
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            console.log('Professor user already exists.');
        } else {
            console.error('Error seeding professor:', error);
        }
    }
}

seedProfessor();
