-- ATENÇÃO: A tabela 'auth.users' é criada automaticamente pelo Supabase.

-- 1. TABELA PROFILES (Dados do Usuário e Permissões)
-- Liga 1:1 com a tabela 'auth.users' para armazenar CPF, nome, etc.
CREATE TABLE public.profiles (
    -- ID do Profile é o mesmo ID do usuário no Auth.users
    id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    
    nome_completo text NOT NULL,
    cpf text UNIQUE NOT NULL,
    telefone text,
    matricula_funcional text,
    
    -- Colunas de Controle
    role text CHECK (role IN ('admin', 'professor')) NOT NULL DEFAULT 'professor',
    status_conta text CHECK (status_conta IN ('pendente_docs', 'em_analise', 'ativo', 'inativo')) NOT NULL DEFAULT 'pendente_docs'
);

-- 2. TABELA FILIACOES (Histórico de Solicitações)
-- Onde guardamos os pedidos de filiação/atualização
CREATE TABLE public.filiacoes (
    id serial PRIMARY KEY,
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
    
    data_solicitacao timestamp with time zone NOT NULL DEFAULT now(),
    data_aprovacao timestamp with time zone,
    
    status text CHECK (status IN ('em_processamento', 'concluido', 'rejeitado')) NOT NULL DEFAULT 'em_processamento',
    
    -- FK para saber qual admin aprovou (liga com o Profiles)
    aprovado_por_admin_id uuid REFERENCES profiles (id) ON DELETE SET NULL, 
    observacoes_admin text
);

-- 3. TABELA DOCUMENTOS (Arquivos e Comprovantes)
-- Guarda os links dos arquivos PDF/imagens. Relacionamento Opcional (Nullable) com filiacoes.
CREATE TABLE public.documentos (
    id serial PRIMARY KEY,
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
    
    -- FK Opcional: Liga o documento a um processo de filiação específico
    filiacao_id int REFERENCES filiacoes (id) ON DELETE CASCADE, 
    
    url_arquivo text NOT NULL,
    tipo_documento text NOT NULL,
    data_upload timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Índices para agilizar buscas por CPF e Matrícula (Opcional, mas profissional)
CREATE INDEX idx_profiles_cpf ON public.profiles (cpf);
CREATE INDEX idx_profiles_matricula ON public.profiles (matricula_funcional);

-- 5. Habilitar RLS (Row Level Security)
-- Isto é crucial para segurança, deve ser feito no UI do Supabase, mas para garantir:
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filiacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
