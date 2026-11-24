-- FindIt: esquema relacional inicial (camada de dados).
-- SQLite armazena datas ISO (AAAA-MM-DD) como TEXT; a API validara o formato.
-- Usuario que cadastrou um item fica registrado em itens.cadastrado_por.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL CHECK (length(trim(nome)) BETWEEN 2 AND 100),
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    senha_hash TEXT NOT NULL,
    papel TEXT NOT NULL DEFAULT 'usuario'
        CHECK (papel IN ('usuario', 'administrador')),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL CHECK (length(trim(titulo)) BETWEEN 3 AND 120),
    descricao TEXT NOT NULL CHECK (length(trim(descricao)) >= 5),
    local_encontrado TEXT NOT NULL,
    data_encontro TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'disponivel'
        CHECK (status IN ('disponivel', 'devolvido')),
    cadastrado_por INTEGER NOT NULL,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cadastrado_por) REFERENCES usuarios(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS solicitacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    solicitante_id INTEGER NOT NULL,
    mensagem TEXT NOT NULL CHECK (length(trim(mensagem)) >= 5),
    status TEXT NOT NULL DEFAULT 'pendente'
        CHECK (status IN ('pendente', 'encerrada')),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES itens(id) ON DELETE RESTRICT,
    FOREIGN KEY (solicitante_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    -- Evita solicitar o mesmo item duas vezes, mesmo sob requisicoes simultaneas.
    UNIQUE (item_id, solicitante_id)
);

CREATE INDEX IF NOT EXISTS idx_itens_status ON itens(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_item ON solicitacoes(item_id);
