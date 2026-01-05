const knex = require('../config/connection');

class User {
    static async findByCpf(cpf) {
        return knex('profiles').where({ cpf }).first();
    }

    static async findById(id) {
        return knex('profiles').where({ id }).first();
    }

    static async findByIdWithFiliation(id) {
        return knex('profiles as p')
            .leftJoin('filiacoes as f', 'p.id', 'f.user_id')
            .select('p.*', 'f.status as status_filiacao')
            .where('p.id', id)
            .first();
    }

    static async update(id, data) {
        return knex('profiles').where({ id }).update(data);
    }

    static async updatePassword(id, hashedPassword) {
        return knex('profiles')
            .where({ id })
            .update({
                password_hash: hashedPassword,
                change_password_required: 0
            });
    }

    static async setResetToken(id, token, expires) {
        return knex('profiles')
            .where({ id })
            .update({
                reset_token: token,
                reset_token_expires: expires.toISOString()
            });
    }

    static async clearResetTokenAndSetPassword(id, hashedPassword) {
        return knex('profiles')
            .where({ id })
            .update({
                password_hash: hashedPassword,
                reset_token: null,
                reset_token_expires: null,
                change_password_required: 0
            });
    }
}

module.exports = User;
