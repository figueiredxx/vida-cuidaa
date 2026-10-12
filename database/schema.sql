-- Plataforma Web Educativa - Saude Sexual e Reprodutiva e Planejamento Familiar
-- Schema do banco de dados (SQLite)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    papel TEXT NOT NULL DEFAULT 'admin' CHECK (papel IN ('admin', 'editor')),
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    descricao TEXT
);

CREATE TABLE IF NOT EXISTS conteudo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    resumo TEXT,
    corpo_html TEXT NOT NULL,
    fontes TEXT NOT NULL,
    faixa_etaria TEXT NOT NULL DEFAULT 'todas' CHECK (faixa_etaria IN ('adolescente', 'adulto', 'todas')),
    publicado INTEGER NOT NULL DEFAULT 0 CHECK (publicado IN (0, 1)),
    visualizacoes INTEGER NOT NULL DEFAULT 0,
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (categoria_id) REFERENCES categoria(id)
);

CREATE TABLE IF NOT EXISTS quiz (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER,
    titulo TEXT NOT NULL,
    descricao TEXT,
    FOREIGN KEY (categoria_id) REFERENCES categoria(id)
);

CREATE TABLE IF NOT EXISTS questao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    conteudo_id INTEGER,
    enunciado TEXT NOT NULL,
    explicacao TEXT,
    ordem INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE CASCADE,
    FOREIGN KEY (conteudo_id) REFERENCES conteudo(id)
);

CREATE TABLE IF NOT EXISTS alternativa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questao_id INTEGER NOT NULL,
    texto TEXT NOT NULL,
    correta INTEGER NOT NULL DEFAULT 0 CHECK (correta IN (0, 1)),
    FOREIGN KEY (questao_id) REFERENCES questao(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tentativa_quiz (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    usuario_id INTEGER,
    pontuacao INTEGER NOT NULL,
    total INTEGER NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (quiz_id) REFERENCES quiz(id),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

CREATE TABLE IF NOT EXISTS duvida (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pergunta TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'respondida', 'rejeitada')),
    publicada INTEGER NOT NULL DEFAULT 0 CHECK (publicada IN (0, 1)),
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resposta_duvida (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    duvida_id INTEGER NOT NULL UNIQUE,
    usuario_id INTEGER NOT NULL,
    resposta TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (duvida_id) REFERENCES duvida(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

CREATE TABLE IF NOT EXISTS glossario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    termo TEXT NOT NULL UNIQUE,
    definicao TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS unidade_saude (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_cnes TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    logradouro TEXT,
    numero TEXT,
    bairro TEXT,
    telefone TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    tipo_unidade INTEGER NOT NULL,
    atende_sus INTEGER NOT NULL DEFAULT 0,
    turno_atendimento TEXT
);

CREATE INDEX IF NOT EXISTS idx_conteudo_categoria_publicado ON conteudo(categoria_id, publicado);
CREATE INDEX IF NOT EXISTS idx_conteudo_faixa_publicado ON conteudo(faixa_etaria, publicado);
CREATE INDEX IF NOT EXISTS idx_questao_quiz ON questao(quiz_id);
CREATE INDEX IF NOT EXISTS idx_alternativa_questao ON alternativa(questao_id);
CREATE INDEX IF NOT EXISTS idx_questao_conteudo ON questao(conteudo_id);
CREATE INDEX IF NOT EXISTS idx_duvida_status ON duvida(status);
CREATE INDEX IF NOT EXISTS idx_unidade_saude_bairro ON unidade_saude(bairro);
