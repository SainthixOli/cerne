const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// ==========================================
// CONFIGURAÇÃO DE SEGURANÇA DO UPLOAD
// ==========================================

// Tipos MIME permitidos
const ALLOWED_MIME_TYPES = {
    'application/pdf': [0x25, 0x50, 0x44, 0x46],  // PDF magic bytes: %PDF
    'image/jpeg': [0xFF, 0xD8, 0xFF],              // JPEG magic bytes
    'image/png': [0x89, 0x50, 0x4E, 0x47],         // PNG magic bytes
    'image/jpg': [0xFF, 0xD8, 0xFF],               // JPG magic bytes (alias)
};

// Extensions permitidas (whitelist)
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

// Limites de tamanho (em bytes)
const SIZE_LIMITS = {
    DOCUMENT: 10 * 1024 * 1024,    // 10 MB para documentos
    PHOTO: 5 * 1024 * 1024,         // 5 MB para fotos
    TEMPLATE: 10 * 1024 * 1024,     // 10 MB para templates
};

// ==========================================
// ARMAZENAMENTO EM MEMÓRIA + VALIDAÇÃO
// ==========================================

const storage = multer.memoryStorage();

// Buffer temporário para validação de magic bytes
let uploadBuffer = null;

// ==========================================
// VALIDAÇÃO DE ARQUIVO
// ==========================================

const fileFilter = (req, file, cb) => {
    try {
        // 1. Verificar extensão (whitelist)
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return cb(new Error(`Extensão não permitida: ${ext}. Permitidas: ${ALLOWED_EXTENSIONS.join(', ')}`));
        }

        // 2. Verificar MIME type
        if (!Object.keys(ALLOWED_MIME_TYPES).includes(file.mimetype)) {
            return cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
        }

        // 3. Store buffer for magic bytes check later
        // (será validado após o arquivo ser carregado)
        uploadBuffer = null;
        cb(null, true);

    } catch (error) {
        cb(error);
    }
};

// ==========================================
// CRIAÇÃO DO MIDDLEWARE MULTER
// ==========================================

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: SIZE_LIMITS.DOCUMENT,  // Limite padrão
        files: 1,                         // Apenas 1 arquivo por requisição
    }
});

// ==========================================
// MIDDLEWARE DE PÓS-PROCESSAMENTO
// ==========================================

/**
 * Valida magic bytes e salva arquivo com nome aleatório
 * Use após o multer ter carregado o arquivo
 */
const validateAndSaveUpload = (fieldName = 'file', sizeLimit = SIZE_LIMITS.DOCUMENT) => {
    return (req, res, next) => {
        if (!req.file) {
            return next();  // Sem arquivo é ok, handler faz validação
        }

        try {
            const file = req.file;

            // 1. Validar tamanho
            if (file.size > sizeLimit) {
                const maxMB = (sizeLimit / (1024 * 1024)).toFixed(1);
                const actualMB = (file.size / (1024 * 1024)).toFixed(1);
                throw new Error(
                    `Arquivo muito grande. Máximo: ${maxMB}MB, Recebido: ${actualMB}MB`
                );
            }

            // 2. Validar magic bytes
            const buffer = file.buffer;
            const magicBytes = Buffer.from(buffer).slice(0, 4);
            
            let isValidMagic = false;
            for (const [mime, expectedMagic] of Object.entries(ALLOWED_MIME_TYPES)) {
                if (file.mimetype === mime) {
                    const magic = Buffer.from(expectedMagic);
                    // Comparar apenas os bytes necessários
                    if (magicBytes.slice(0, magic.length).equals(magic)) {
                        isValidMagic = true;
                        break;
                    }
                }
            }

            if (!isValidMagic) {
                throw new Error(
                    'Arquivo inválido: conteúdo não corresponde ao tipo declarado (possível spoofing)'
                );
            }

            // 3. Gerar nome aleatório e seguro
            const randomName = crypto.randomBytes(16).toString('hex');
            const ext = path.extname(file.originalname).toLowerCase();
            const finalFilename = `${randomName}${ext}`;

            // 4. Preparar objeto de arquivo para save
            req.file.finalFilename = finalFilename;
            req.file.uploadedAt = new Date();

            next();

        } catch (error) {
            return res.status(400).json({ 
                error: `Erro ao validar arquivo: ${error.message}`,
                code: 'INVALID_FILE_UPLOAD'
            });
        }
    };
};

// ==========================================
// SALVAMENTO EM DISCO (após validação)
// ==========================================

/**
 * Salva arquivo validado em disco
 * Deve ser usado APÓS validateAndSaveUpload
 */
const saveUploadToDisk = (uploadDir = 'uploads') => {
    return (req, res, next) => {
        if (!req.file || !req.file.buffer) {
            return next();
        }

        try {
            // Criar diretório se não existir
            const fullUploadDir = path.join(__dirname, '../../', uploadDir);
            if (!fs.existsSync(fullUploadDir)) {
                fs.mkdirSync(fullUploadDir, { recursive: true, mode: 0o755 });
            }

            // Salvar arquivo
            const filepath = path.join(fullUploadDir, req.file.finalFilename);
            fs.writeFileSync(filepath, req.file.buffer, { mode: 0o644 });

            // Atualizar path para o controller
            req.file.path = filepath;
            req.file.filename = req.file.finalFilename;

            next();

        } catch (error) {
            console.error('Error saving upload:', error);
            return res.status(500).json({ 
                error: 'Erro ao salvar arquivo',
                details: error.message 
            });
        }
    };
};

module.exports = {
    upload,
    validateAndSaveUpload,
    saveUploadToDisk,
    SIZE_LIMITS,
    ALLOWED_MIME_TYPES,
    ALLOWED_EXTENSIONS,
};

