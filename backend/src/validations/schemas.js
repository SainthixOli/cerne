/**
 * Complete Joi Validation Schemas
 * Validação de entrada para todos os endpoints críticos
 */

const Joi = require('joi');
const PasswordPolicy = require('./passwordPolicy');

// ==================== CUSTOM VALIDATORS ====================

/**
 * Validador customizado para CPF
 */
const cpfValidator = Joi.string()
    .pattern(/^\d{11}$/)
    .required()
    .messages({
        'string.pattern.base': 'CPF deve conter 11 dígitos',
        'string.empty': 'CPF é obrigatório',
        'any.required': 'CPF é obrigatório'
    });

/**
 * Validador customizado para UUID
 */
const uuidValidator = Joi.string()
    .uuid({ version: ['uuidv4'] })
    .messages({
        'string.guid': 'ID deve ser um UUID válido'
    });

/**
 * Validador customizado para email
 */
const emailValidator = Joi.string()
    .email()
    .required()
    .messages({
        'string.email': 'Email inválido',
        'string.empty': 'Email é obrigatório',
        'any.required': 'Email é obrigatório'
    });

// ==================== AUTH SCHEMAS ====================

const loginSchema = Joi.object({
    cpf: cpfValidator,
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
    }).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only': 'As senhas não correspondem',
        'any.required': 'Confirmação de senha é obrigatória'
    })
});

const registerSchema = Joi.object({
    cpf: cpfValidator,
    email: emailValidator,
    nome_completo: Joi.string().min(3).max(100).required().messages({
        'string.min': 'Nome deve ter no mínimo 3 caracteres',
        'string.max': 'Nome não pode ter mais de 100 caracteres',
        'any.required': 'Nome é obrigatório'
    }),
    password: Joi.string().custom((value, helpers) => {
        const validation = PasswordPolicy.validate(value);
        if (!validation.valid) {
            return helpers.error('any.invalid', { 
                message: validation.errors.join(', ') 
            });
        }
        return value;
    }).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'As senhas não correspondem',
        'any.required': 'Confirmação de senha é obrigatória'
    })
});

const forgotPasswordSchema = Joi.object({
    cpf: cpfValidator
});

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
    }).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only': 'As senhas não correspondem'
    })
});

// ==================== AFFILIATION SCHEMAS ====================

const affiliationStatusSchema = Joi.object({
    cpf: cpfValidator
});

const approveAffiliationSchema = Joi.object({
    id: Joi.string().required().messages({
        'any.required': 'ID é obrigatório'
    }),
    reason: Joi.string().max(500).allow(null).messages({
        'string.max': 'Motivo não pode ter mais de 500 caracteres'
    })
});

const rejectAffiliationSchema = Joi.object({
    id: Joi.string().required(),
    reason: Joi.string().min(5).max(500).required().messages({
        'string.min': 'Motivo deve ter no mínimo 5 caracteres',
        'string.max': 'Motivo não pode ter mais de 500 caracteres',
        'any.required': 'Motivo é obrigatório'
    })
});

const transferAffiliationSchema = Joi.object({
    id: Joi.string().required(),
    targetUserId: Joi.string().required().messages({
        'any.required': 'ID do usuário alvo é obrigatório'
    }),
    reason: Joi.string().max(500).allow(null)
});

const requestTransferSchema = Joi.object({
    id: Joi.string().required(),
    targetUserId: Joi.string().required()
});

const requestDisaffiliationSchema = Joi.object({
    reason: Joi.string().min(10).max(1000).required().messages({
        'string.min': 'Motivo deve ter no mínimo 10 caracteres',
        'string.max': 'Motivo não pode ter mais de 1000 caracteres',
        'any.required': 'Motivo é obrigatório'
    })
});

const requestReactivationSchema = Joi.object({
    reason: Joi.string().min(10).max(1000).required()
});

// ==================== PROFILE SCHEMAS ====================

const updateProfileSchema = Joi.object({
    nome_completo: Joi.string().min(3).max(100).required(),
    email: emailValidator,
    endereco: Joi.string().max(255).allow(null),
    telefone: Joi.string().pattern(/^\d{10,11}$/).allow(null).messages({
        'string.pattern.base': 'Telefone deve conter 10 ou 11 dígitos'
    }),
    data_nascimento: Joi.date().iso().max('now').required().messages({
        'date.base': 'Data deve ser válida',
        'date.max': 'Data não pode ser no futuro',
        'any.required': 'Data de nascimento é obrigatória'
    }),
    nacionalidade: Joi.string().max(50).allow(null),
    naturalidade: Joi.string().max(100).allow(null),
    profissao: Joi.string().max(100).allow(null)
}).min(1);

// ==================== ADMIN SCHEMAS ====================

const createAdminSchema = Joi.object({
    cpf: cpfValidator,
    email: emailValidator,
    nome_completo: Joi.string().min(3).max(100).required(),
    role: Joi.string()
        .valid('admin', 'super_admin', 'system_manager')
        .required()
        .messages({
            'any.only': 'Role deve ser: admin, super_admin ou system_manager',
            'any.required': 'Role é obrigatório'
        }),
    password: Joi.string().custom((value, helpers) => {
        const validation = PasswordPolicy.validate(value);
        if (!validation.valid) {
            return helpers.error('any.invalid', { 
                message: validation.errors.join(', ') 
            });
        }
        return value;
    }).required()
});

const updateAdminStatusSchema = Joi.object({
    adminId: Joi.string().required(),
    status: Joi.string().valid('active', 'inactive', 'suspended').required().messages({
        'any.only': 'Status deve ser: active, inactive ou suspended'
    }),
    reason: Joi.string().max(500).allow(null)
});

const saveEvaluationSchema = Joi.object({
    adminId: Joi.string().required(),
    score: Joi.number().min(0).max(10).required().messages({
        'number.min': 'Score deve ser no mínimo 0',
        'number.max': 'Score não pode ser maior que 10',
        'any.required': 'Score é obrigatório'
    }),
    feedback: Joi.string().min(10).max(1000).required(),
    category: Joi.string()
        .valid('performance', 'behavior', 'attendance')
        .required()
});

// ==================== CHAT SCHEMAS ====================

const startConversationSchema = Joi.object({
    targetUserId: Joi.string().required(),
    subject: Joi.string().min(5).max(200).required(),
    message: Joi.string().min(5).max(2000).required()
});

const sendMessageSchema = Joi.object({
    conversationId: Joi.string().required(),
    message: Joi.string().min(1).max(2000).required().messages({
        'string.min': 'Mensagem não pode estar vazia',
        'string.max': 'Mensagem não pode ter mais de 2000 caracteres'
    })
});

// ==================== NOTIFICATION SCHEMAS ====================

const createBroadcastSchema = Joi.object({
    title: Joi.string().min(5).max(100).required(),
    message: Joi.string().min(10).max(2000).required(),
    targetRole: Joi.string()
        .valid('admin', 'member', 'all')
        .required()
        .messages({
            'any.only': 'Target deve ser: admin, member ou all'
        }),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium')
});

const approveBroadcastSchema = Joi.object({
    id: Joi.string().required(),
    reason: Joi.string().max(500).allow(null)
});

// ==================== PAGINATION SCHEMA ====================

const paginationSchema = Joi.object({
    page: Joi.number().min(1).default(1).messages({
        'number.min': 'Página deve ser >= 1'
    }),
    limit: Joi.number().min(1).max(100).default(20).messages({
        'number.min': 'Limit deve ser >= 1',
        'number.max': 'Limit não pode ser maior que 100'
    }),
    sort: Joi.string().max(50).allow(null),
    order: Joi.string().valid('asc', 'desc').default('desc')
});

// ==================== FILTER SCHEMAS ====================

const filterAffiliationsSchema = Joi.object({
    status: Joi.string()
        .valid('pending', 'active', 'inactive', 'suspended')
        .allow(null),
    search: Joi.string().max(100).allow(null),
    startDate: Joi.date().iso().allow(null),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).allow(null),
    ...paginationSchema.describe().keys
});

// ==================== SYSTEM SCHEMAS ====================

const executeConsoleCommandSchema = Joi.object({
    command: Joi.string()
        .pattern(/^(stats|health|backup|logs)$/)
        .required()
        .messages({
            'string.pattern.base': 'Comando inválido. Apenas: stats, health, backup, logs'
        })
});

module.exports = {
    // Auth
    loginSchema,
    changePasswordSchema,
    registerSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    
    // Affiliations
    affiliationStatusSchema,
    approveAffiliationSchema,
    rejectAffiliationSchema,
    transferAffiliationSchema,
    requestTransferSchema,
    requestDisaffiliationSchema,
    requestReactivationSchema,
    
    // Profile
    updateProfileSchema,
    
    // Admin
    createAdminSchema,
    updateAdminStatusSchema,
    saveEvaluationSchema,
    
    // Chat
    startConversationSchema,
    sendMessageSchema,
    
    // Notifications
    createBroadcastSchema,
    approveBroadcastSchema,
    
    // Pagination & Filters
    paginationSchema,
    filterAffiliationsSchema,
    
    // System
    executeConsoleCommandSchema,
    
    // Validators
    cpfValidator,
    emailValidator,
    uuidValidator
};
