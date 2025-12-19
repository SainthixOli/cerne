-- SQLite version of the schema

CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY, -- UUID stored as TEXT
    nome_completo TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE, -- Added for login/notifications
    password_hash TEXT, -- Added for local auth
    change_password_required BOOLEAN DEFAULT 0, -- Force password change
    telefone TEXT,
    matricula_funcional TEXT,
    role TEXT CHECK (role IN ('admin', 'professor', 'super_admin')) NOT NULL DEFAULT 'professor',
    status_conta TEXT CHECK (status_conta IN ('pendente_docs', 'em_analise', 'ativo', 'inativo')) NOT NULL DEFAULT 'pendente_docs',
    reset_token TEXT,
    reset_token_expires DATETIME,
    photo_url TEXT
);

CREATE TABLE IF NOT EXISTS filiacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES profiles (id) ON DELETE CASCADE,
    data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao DATETIME,
    status TEXT CHECK (status IN ('em_processamento', 'concluido', 'rejeitado')) NOT NULL DEFAULT 'em_processamento',
    aprovado_por_admin_id TEXT REFERENCES profiles (id) ON DELETE SET NULL,
    observacoes_admin TEXT
);

CREATE TABLE IF NOT EXISTS documentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES profiles (id) ON DELETE CASCADE,
    filiacao_id INTEGER REFERENCES filiacoes (id) ON DELETE CASCADE,
    url_arquivo TEXT NOT NULL,
    tipo_documento TEXT NOT NULL,
    data_upload DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    evaluator_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    month_ref TEXT NOT NULL, -- Format YYYY-MM
    score INTEGER CHECK(score >= 1 AND score <= 5),
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(admin_id, month_ref)
);

CREATE TABLE IF NOT EXISTS filiation_chat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filiacao_id INTEGER NOT NULL REFERENCES filiacoes(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
