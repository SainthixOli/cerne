const { sendError } = require('../utils/apiResponse');

const OPTIONS = { abortEarly: false, allowUnknown: false, stripUnknown: false, convert: true };

const validate = (schemas) => {
    const targets = schemas && typeof schemas.validate === 'function' ? { body: schemas } : schemas;
    const validationMiddleware = (req, res, next) => {
        for (const target of ['params', 'query', 'body']) {
            const schema = targets?.[target];
            if (!schema) continue;
            const { error, value } = schema.validate(req[target], OPTIONS);
            if (error) {
                const details = error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }));
                return sendError(res, 400, 'Dados de entrada inválidos', 'VALIDATION_ERROR', details);
            }
            req[target] = value;
        }
        return next();
    };
    validationMiddleware.validationTargets = Object.freeze(Object.keys(targets || {}));
    return validationMiddleware;
};

module.exports = validate;
