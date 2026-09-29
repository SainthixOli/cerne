const crypto = require('crypto');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const extensions = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png'
};
const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png'
};
const memoryObjects = new Map();
let client;

function driver() {
    return process.env.OBJECT_STORAGE_DRIVER || (process.env.NODE_ENV === 'test' ? 'memory' : 'supabase');
}

function bucket() {
    return process.env.OBJECT_STORAGE_BUCKET || 'cerne-private-documents';
}

function supabase() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
        throw new Error('Object storage privado não configurado');
    }
    if (!client) client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
    return client;
}

function validateKey(key) {
    if (typeof key !== 'string' || key.includes('\0') || key.includes('..') || path.isAbsolute(key)) {
        throw new Error('Invalid storage key');
    }
    const parts = key.split('/');
    if (parts.length > 2 || (parts.length === 2 && !/^[1-9][0-9]*$/.test(parts[0]))) {
        throw new Error('Invalid storage key');
    }
    const filename = parts.at(-1);
    const extension = path.extname(filename).toLowerCase();
    const identifier = filename.slice(0, -extension.length);
    if (!['.pdf', '.jpg', '.jpeg', '.png'].includes(extension) || identifier.length !== 48 ||
        [...identifier].some((character) => !'0123456789abcdef'.includes(character))) {
        throw new Error('Invalid storage key');
    }
    return key;
}

async function save(buffer, mimeType, tenantId) {
    const extension = extensions[mimeType];
    if (!extension || !Buffer.isBuffer(buffer)) throw new Error('Invalid upload');
    const prefix = Number.isInteger(tenantId) && tenantId > 0 ? `${tenantId}/` : '';
    const key = `${prefix}${crypto.randomBytes(24).toString('hex')}${extension}`;
    if (driver() === 'memory') {
        memoryObjects.set(key, { buffer: Buffer.from(buffer), mimeType });
        return key;
    }
    if (driver() !== 'supabase') throw new Error('Object storage driver inválido');
    const { error } = await supabase().storage.from(bucket()).upload(key, buffer, {
        contentType: mimeType,
        upsert: false,
        cacheControl: 'private, no-store'
    });
    if (error) throw new Error('Falha no object storage', { cause: error });
    return key;
}

async function read(storedKey) {
    const key = validateKey(storedKey);
    if (driver() === 'memory') {
        const object = memoryObjects.get(key);
        if (!object) throw new Error('Object not found');
        return { buffer: Buffer.from(object.buffer), mimeType: object.mimeType };
    }
    const { data, error } = await supabase().storage.from(bucket()).download(key);
    if (error || !data) throw new Error('Object not found', { cause: error });
    const extension = path.extname(key).toLowerCase();
    return { buffer: Buffer.from(await data.arrayBuffer()), mimeType: mimeTypes[extension] };
}

async function resolve(storedKey) {
    return validateKey(storedKey);
}

async function remove(storedKey) {
    if (!storedKey) return;
    const key = validateKey(storedKey);
    if (driver() === 'memory') {
        memoryObjects.delete(key);
        return;
    }
    const { error } = await supabase().storage.from(bucket()).remove([key]);
    if (error) throw new Error('Falha ao remover objeto', { cause: error });
}

function objectCount() {
    if (driver() !== 'memory') throw new Error('Contagem disponível somente no driver de teste');
    return memoryObjects.size;
}

module.exports = { save, read, resolve, remove, objectCount };
