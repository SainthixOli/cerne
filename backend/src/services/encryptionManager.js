/**
 * Encryption Manager
 * Criptografa campos sensíveis com AES-256-GCM
 */

const crypto = require('crypto');
const logger = require('../config/logger');

class EncryptionManager {
    constructor() {
        // Chave de criptografia (32 bytes para AES-256)
        this.encryptionKey = crypto
            .createHash('sha256')
            .update(process.env.ENCRYPTION_KEY || process.env.JWT_SECRET)
            .digest();

        if (!this.encryptionKey) {
            logger.warn('ENCRYPTION_KEY não configurada, usando JWT_SECRET como fallback');
        }
    }

    /**
     * Criptografa um valor
     * @param {string} plaintext - Valor a ser criptografado
     * @returns {{iv: string, encryptedData: string, authTag: string}}
     */
    encrypt(plaintext) {
        try {
            const iv = crypto.randomBytes(16); // Initialization Vector
            const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

            let encrypted = cipher.update(plaintext, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag();

            return {
                iv: iv.toString('hex'),
                encryptedData: encrypted,
                authTag: authTag.toString('hex')
            };
        } catch (error) {
            logger.error('Erro ao criptografar dados', { error: error.message });
            throw error;
        }
    }

    /**
     * Descriptografa um valor
     * @param {string} iv - Initialization Vector (hex)
     * @param {string} encryptedData - Dados criptografados (hex)
     * @param {string} authTag - Auth Tag (hex)
     * @returns {string}
     */
    decrypt(iv, encryptedData, authTag) {
        try {
            const decipher = crypto.createDecipheriv(
                'aes-256-gcm',
                this.encryptionKey,
                Buffer.from(iv, 'hex')
            );

            decipher.setAuthTag(Buffer.from(authTag, 'hex'));

            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            logger.error('Erro ao descriptografar dados', { error: error.message });
            throw error;
        }
    }

    /**
     * Criptografa um objeto e retorna como string JSON
     * @param {object} obj - Objeto a ser criptografado
     * @returns {string} - JSON string com dados criptografados
     */
    encryptObject(obj) {
        const json = JSON.stringify(obj);
        const encrypted = this.encrypt(json);
        return JSON.stringify(encrypted);
    }

    /**
     * Descriptografa um objeto
     * @param {string} encryptedJson - JSON string com dados criptografados
     * @returns {object}
     */
    decryptObject(encryptedJson) {
        const encrypted = JSON.parse(encryptedJson);
        const decrypted = this.decrypt(encrypted.iv, encrypted.encryptedData, encrypted.authTag);
        return JSON.parse(decrypted);
    }

    /**
     * Gera hash para campos que precisam ser pesquisáveis sem revelar valor original
     * Usa SHA-256 com salt
     * @param {string} value - Valor a ser hashado
     * @param {string} salt - Salt (opcional, gera novo se não fornecido)
     * @returns {{hash: string, salt: string}}
     */
    static hashValue(value, salt = null) {
        const useSalt = salt || crypto.randomBytes(16).toString('hex');
        const hash = crypto
            .createHash('sha256')
            .update(value + useSalt)
            .digest('hex');

        return { hash, salt: useSalt };
    }

    /**
     * Valida um valor contra seu hash
     * @param {string} value - Valor a validar
     * @param {string} hash - Hash armazenado
     * @param {string} salt - Salt armazenado
     * @returns {boolean}
     */
    static verifyHash(value, hash, salt) {
        const testHash = crypto
            .createHash('sha256')
            .update(value + salt)
            .digest('hex');

        return testHash === hash;
    }

    /**
     * Gera hash para auditoria (não requer salt)
     * @param {string} value - Valor a ser hashado
     * @returns {string}
     */
    static hashForAudit(value) {
        return crypto
            .createHash('sha256')
            .update(value)
            .digest('hex');
    }
}

module.exports = new EncryptionManager();
