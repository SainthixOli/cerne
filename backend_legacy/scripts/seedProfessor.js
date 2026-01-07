const { getDb } = require('../src/config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function seedProfessor() {
    try {
        const db = await getDb();
        const password = '123';
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();

        await db.run(
            `INSERT INTO profiles (id, nome_completo, cpf, email, role, status_conta, password_hash)
       VALUES (?, 'Professor Teste', '111.111.111-11', 'prof@teste.com', 'professor', 'ativo', ?)`,
            [id, hashedPassword]
        );

        console.log('Professor user created successfully!');
        console.log('CPF: 111.111.111-11');
        console.log('Password: 123');
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            console.log('Professor user already exists.');
        } else {
            console.error('Error seeding professor:', error);
        }
    }
}

seedProfessor();
