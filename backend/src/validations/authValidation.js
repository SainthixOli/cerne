const Joi = require('joi');
const PasswordPolicy = require('./passwordPolicy');

const loginSchema = Joi.object({
    cpf: Joi.string().required().messages({
        'string.empty': 'CPF é obrigatório',
        'any.required': 'CPF é obrigatório'
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Senha é obrigatória',
        'any.required': 'Senha é obrigatória'
    })
});

const changePasswordSchema = Joi.object({
    newPassword: Joi.string().custom((value, helpers) => {
        const validation = PasswordPolicy.validate(value);
        if (!validation.valid) {
            return helpers.error('any.invalid', { 
                message: validation.errors.join(', ') 
            });
        }
        return value;
    }).required().messages({
        'any.invalid': '{#message}',
        'any.required': 'A nova senha é obrigatória'
    }),
    confirmPassword: Joi.string().required().messages({
        'any.required': 'Confirmação de senha é obrigatória'
    }).external(async (value, helpers) => {
        const newPassword = helpers.prefs.externals?.newPassword || helpers.state.ancestors[0]?.newPassword;
        if (value !== newPassword) {
            throw new Error('As senhas não correspondem');
        }
    })
});

/**
 * Schema para registro de novo usuário
 * Valida CPF, email e senha forte
 */
const registerSchema = Joi.object({
    cpf: Joi.string().pattern(/^\d{11}$/).required().messages({
        'string.empty': 'CPF é obrigatório',
        'string.pattern.base': 'CPF deve ter 11 dígitos',
        'any.required': 'CPF é obrigatório'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Email inválido',
        'string.empty': 'Email é obrigatório',
        'any.required': 'Email é obrigatório'
    }),
    password: Joi.string().custom((value, helpers) => {
        const validation = PasswordPolicy.validate(value);
        if (!validation.valid) {
            return helpers.error('any.invalid', { 
                message: validation.errors.join(', ') 
            });
        }
        return value;
    }).required().messages({
        'any.invalid': '{#message}',
        'any.required': 'Senha é obrigatória'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'As senhas não correspondem',
        'any.required': 'Confirmação de senha é obrigatória'
    })
});

/**
 * Schema para reset de senha (recuperação)
 */
const resetPasswordSchema = Joi.object({
    token: Joi.string().required().messages({
        'any.required': 'Token é obrigatório'
    }),
    newPassword: Joi.string().custom((value, helpers) => {
        const validation = PasswordPolicy.validate(value);
        if (!validation.valid) {
            return helpers.error('any.invalid', { 
                message: validation.errors.join(', ') 
            });
        }
        return value;
    }).required().messages({
        'any.invalid': '{#message}',
        'any.required': 'Senha é obrigatória'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only': 'As senhas não correspondem',
        'any.required': 'Confirmação de senha é obrigatória'
    })
});

module.exports = {
    loginSchema,
    changePasswordSchema,
    registerSchema,
    resetPasswordSchema
};
