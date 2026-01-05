const Joi = require('joi');

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
    newPassword: Joi.string().min(6).required().messages({
        'string.min': 'A nova senha deve ter no mínimo 6 caracteres',
        'any.required': 'A nova senha é obrigatória'
    })
});

module.exports = {
    loginSchema,
    changePasswordSchema
};
