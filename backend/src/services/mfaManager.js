/**
 * MFA (Multi-Factor Authentication) with TOTP
 * Implementa autenticação de dois fatores usando Time-based One Time Password
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const logger = require('../config/logger');

class MFAManager {
    /**
     * Gera novo secret para TOTP
     * @param {string} userEmail - Email do usuário
     * @returns {Promise<{secret: string, qrCode: string}>}
     */
    static async generateSecret(userEmail) {
        try {
            const secret = speakeasy.generateSecret({
                name: `Filiação Sindicato (${userEmail})`,
                issuer: 'Filiacao Sindicato',
                length: 32
            });

            const qrCode = await QRCode.toDataURL(secret.otpauth_url);

            logger.info('MFA secret gerado', {
                userId: userEmail,
                timestamp: new Date().toISOString()
            });

            return {
                secret: secret.base32,
                qrCode: qrCode
            };
        } catch (error) {
            logger.error('Erro ao gerar MFA secret', {
                error: error.message,
                userId: userEmail
            });
            throw error;
        }
    }

    /**
     * Valida token TOTP
     * @param {string} token - Token de 6 dígitos
     * @param {string} secret - Secret armazenado
     * @returns {boolean}
     */
    static verifyToken(token, secret) {
        try {
            if (!token || !secret) {
                return false;
            }

            // Verifica token com janela de 1 minuto (30 segundos antes/depois)
            const verified = speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: token,
                window: 2
            });

            if (verified) {
                logger.debug('Token TOTP válido');
            } else {
                logger.warn('Token TOTP inválido');
            }

            return verified;
        } catch (error) {
            logger.error('Erro ao validar token TOTP', {
                error: error.message
            });
            return false;
        }
    }

    /**
     * Gera backup codes (16 códigos para recuperação)
     * @returns {string[]}
     */
    static generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 16; i++) {
            const code = Math.random()
                .toString(36)
                .substring(2, 10)
                .toUpperCase();
            codes.push(code);
        }
        return codes;
    }

    /**
     * Valida backup code
     * @param {string} code - Backup code fornecido
     * @param {string[]} storedCodes - Códigos armazenados (hash)
     * @returns {boolean}
     */
    static verifyBackupCode(code, storedCodes) {
        return storedCodes.some(stored => stored === code);
    }

    /**
     * Gera QR Code para manual entry
     * @param {string} secret - Secret base32
     * @returns {string}
     */
    static formatSecretForManual(secret) {
        // Formata como: XXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXX
        return secret.match(/.{1,4}/g).join(' ');
    }
}

module.exports = MFAManager;
