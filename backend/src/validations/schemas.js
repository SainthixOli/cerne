const Joi = require('joi');
const PasswordPolicy = require('./passwordPolicy');

const cleanCpf = (value, helpers) => {
    const normalized = value.replace(/\D/g, '');
    return /^\d{11}$/.test(normalized) ? normalized : helpers.error('string.pattern.base');
};

const cpfValidator = Joi.string().trim().max(14).custom(cleanCpf).required().messages({
    'string.pattern.base': 'CPF deve conter 11 dígitos',
    'any.required': 'CPF é obrigatório',
    'string.empty': 'CPF é obrigatório'
});
const emailValidator = Joi.string().trim().lowercase().email().max(254).required();
const optionalEmail = Joi.string().trim().lowercase().email().max(254);
const idValidator = Joi.string().trim().pattern(/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/).required();
const integerIdValidator = Joi.string().pattern(/^[1-9]\d*$/).required();
const monthValidator = Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).required();
const emptyBodySchema = Joi.object({});
const phoneValidator = Joi.string().trim().max(16).custom((value, helpers) => {
    const normalized = value.replace(/\D/g, '');
    return /^\d{10,11}$/.test(normalized) ? normalized : helpers.error('string.pattern.base');
}).allow('', null).messages({ 'string.pattern.base': 'Telefone deve conter 10 ou 11 dígitos' });

const passwordValidator = Joi.string().max(128).custom((value, helpers) => {
    const result = PasswordPolicy.validate(value);
    return result.valid ? value : helpers.message({ custom: result.errors.join(', ') });
}).required();

const loginSchema = Joi.object({ cpf: cpfValidator, password: Joi.string().min(1).max(128).required() });
const changePasswordSchema = Joi.object({
    newPassword: passwordValidator,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).optional()
});
const forgotPasswordSchema = Joi.object({ cpf: cpfValidator });
const resetPasswordSchema = Joi.object({
    token: Joi.string().uuid({ version: 'uuidv4' }).required(),
    newPassword: passwordValidator,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).optional()
});

const registerSchema = Joi.object({
    nome: Joi.string().trim().min(3).max(120).required(),
    cpf: cpfValidator,
    email: emailValidator,
    telefone: phoneValidator,
    matricula: Joi.string().trim().max(50).allow(''),
    rg: Joi.string().trim().max(30).allow(''),
    orgao_emissor: Joi.string().trim().max(30).allow(''),
    nacionalidade: Joi.string().trim().max(60).allow(''),
    estado_civil: Joi.string().trim().max(40).allow(''),
    cep: Joi.string().trim().pattern(/^\d{8}$/).allow(''),
    endereco: Joi.string().trim().max(255).allow(''),
    numero: Joi.string().trim().max(20).allow(''),
    complemento: Joi.string().trim().max(100).allow(''),
    bairro: Joi.string().trim().max(100).allow(''),
    cidade: Joi.string().trim().max(100).allow(''),
    uf: Joi.string().trim().uppercase().length(2).allow('')
});

const affiliationStatusSchema = Joi.object({ cpf: cpfValidator });
const affiliationIdParamsSchema = Joi.object({ id: integerIdValidator });
const userIdParamsSchema = Joi.object({ userId: idValidator });
const documentIdParamsSchema = Joi.object({ documentId: integerIdValidator });
const approveAffiliationSchema = Joi.object({ observacoes: Joi.string().trim().max(1000).allow('', null) });
const rejectAffiliationSchema = Joi.object({ observacoes: Joi.string().trim().min(5).max(1000).required() });
const transferAffiliationSchema = Joi.object({ targetAdminId: idValidator });
const affiliationChatSchema = Joi.object({ message: Joi.string().trim().min(1).max(2000).required() });

const updateProfileSchema = Joi.object({
    nome_completo: Joi.string().trim().min(3).max(120),
    telefone: phoneValidator,
    email: optionalEmail,
    matricula_funcional: Joi.string().trim().max(50).allow('', null)
}).min(1);

const createAdminSchema = Joi.object({
    nome: Joi.string().trim().min(3).max(120).required(),
    cpf: cpfValidator,
    email: emailValidator,
    password: passwordValidator
});
const adminIdParamsSchema = Joi.object({ adminId: idValidator });
const updateAdminStatusSchema = Joi.object({ status: Joi.string().valid('ativo', 'inativo').required() });
const performanceQuerySchema = Joi.object({ adminId: idValidator, month: monthValidator });
const emptyQuerySchema = Joi.object({});
const saveEvaluationSchema = Joi.object({
    adminId: idValidator,
    month: monthValidator,
    score: Joi.number().integer().min(0).max(5).required(),
    feedback: Joi.string().trim().max(2000).allow('').required(),
    criteria_productivity: Joi.number().integer().min(0).max(5).default(0),
    criteria_quality: Joi.number().integer().min(0).max(5).default(0),
    criteria_proactivity: Joi.number().integer().min(0).max(5).default(0),
    criteria_punctuality: Joi.number().integer().min(0).max(5).default(0),
    visible: Joi.boolean().default(false)
});

const startConversationSchema = Joi.object({ userId: idValidator });
const conversationParamsSchema = Joi.object({ conversationId: idValidator });
const conversationQuerySchema = Joi.object({ mode: Joi.string().valid('all') });
const sendMessageSchema = Joi.object({ content: Joi.string().trim().min(1).max(2000).required() });

const createBroadcastSchema = Joi.object({
    title: Joi.string().trim().min(3).max(100).required(),
    message: Joi.string().trim().min(1).max(2000).required(),
    target_group: Joi.string().valid('all', 'professors', 'admins').default('all')
});
const notificationIdParamsSchema = Joi.object({ id: idValidator });
const settingParamsSchema = Joi.object({ key: Joi.string().pattern(/^[a-z][a-z0-9_.-]{0,99}$/).required() });
const updateSettingSchema = Joi.object({ value: Joi.alternatives().try(Joi.string().max(10000), Joi.number(), Joi.boolean()).required() });
const executeConsoleCommandSchema = Joi.object({ command: Joi.string().valid('status', 'help', 'logs', 'version', 'clear').required() });

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1), limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().max(50), order: Joi.string().valid('asc', 'desc').default('desc')
});
const filterAffiliationsSchema = Joi.object({
    status: Joi.string().valid('em_processamento', 'concluido', 'rejeitado', 'desfiliado'),
    search: Joi.string().trim().max(100)
});

const alertIdParamsSchema = Joi.object({ alertId: idValidator });
const alertsQuerySchema = Joi.object({
    severity: Joi.string().valid('low', 'medium', 'high', 'critical'), type: Joi.string().max(80),
    limit: Joi.number().integer().min(1).max(100).default(50), offset: Joi.number().integer().min(0).default(0)
});
const acknowledgeAlertSchema = Joi.object({ notes: Joi.string().trim().max(1000).allow('', null) });
const securityStatsQuerySchema = Joi.object({ timeRange: Joi.string().valid('1h', '24h', '7d', '30d').default('24h') });
const auditLogQuerySchema = Joi.object({
    eventType: Joi.string().max(80), severity: Joi.string().valid('low', 'medium', 'high', 'critical'),
    userId: idValidator.optional(), ip: Joi.string().ip(), startDate: Joi.date().iso(), endDate: Joi.date().iso(),
    limit: Joi.number().integer().min(1).max(100).default(100), offset: Joi.number().integer().min(0).default(0)
});
const blockIpSchema = Joi.object({
    ip: Joi.string().ip({ cidr: 'forbidden' }).required(), reason: Joi.string().trim().min(5).max(500).required(),
    duration: Joi.number().integer().min(1).max(720).default(24)
});
const banUserSchema = Joi.object({
    userId: idValidator, reason: Joi.string().trim().min(5).max(500).required(),
    duration: Joi.number().integer().min(1).max(720).optional()
});

module.exports = {
    loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, registerSchema,
    affiliationStatusSchema, affiliationIdParamsSchema, userIdParamsSchema, documentIdParamsSchema,
    approveAffiliationSchema, rejectAffiliationSchema, transferAffiliationSchema, affiliationChatSchema,
    emptyBodySchema, updateProfileSchema, createAdminSchema, adminIdParamsSchema, updateAdminStatusSchema,
    performanceQuerySchema, emptyQuerySchema, saveEvaluationSchema, startConversationSchema,
    conversationParamsSchema, conversationQuerySchema, sendMessageSchema, createBroadcastSchema,
    notificationIdParamsSchema, settingParamsSchema, updateSettingSchema, executeConsoleCommandSchema,
    paginationSchema, filterAffiliationsSchema, alertIdParamsSchema, alertsQuerySchema,
    acknowledgeAlertSchema, securityStatsQuerySchema, auditLogQuerySchema, blockIpSchema, banUserSchema,
    cpfValidator, emailValidator, idValidator
};
