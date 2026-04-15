const { getDb } = require('../src/config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function seedAdmin() {
    try {
        const db = await getDb();
        const password = 'admin';
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();

        await db.run(
            `INSERT INTO profiles (id, nome_completo, cpf, email, role, status_conta, password_hash)
       VALUES (?, 'Administrador', '000.000.000-00', 'admin@sinpro.com', 'admin', 'ativo', ?)`,
            [id, hashedPassword]
        );

        console.log('Admin user created successfully!');
        console.log('CPF: 000.000.000-00');
        console.log('Password: admin');
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            console.log('Admin user already exists.');
        } else {
            console.error('Error seeding admin:', error);
        }
    }
}

seedAdmin();
