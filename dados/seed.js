/**
 * FindIt - dados ficticios para demonstracao (camada de dados).
 * Cria as tabelas e insere usuarios, itens e solicitacao de exemplo.
 */
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcrypt');
const { abrirBanco } = require('./conexao');

/**
 * Garante a existencia de um usuario ficticio com senha em hash.
 * @param {import('better-sqlite3').Database} banco - Conexao ao banco.
 * @param {string} nome - Nome do usuario de demonstracao.
 * @param {string} email - Email unico de demonstracao.
 * @param {'usuario'|'administrador'} papel - Perfil a ser atribuido.
 * @param {string} senha - Senha apenas para gerar hash localmente.
 * @returns {number} ID do usuario criado ou ja existente.
 */
function garantirUsuario(banco, nome, email, papel, senha) {
  const existente = banco.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existente) return existente.id;
  // A senha nunca e gravada em texto puro no banco.
  const senhaHash = bcrypt.hashSync(senha, 12);
  const resultado = banco.prepare(
    'INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (?, ?, ?, ?)'
  ).run(nome, email, senhaHash, papel);
  return Number(resultado.lastInsertRowid);
}

/**
 * Cria um item ficticio apenas se ainda nao estiver no banco.
 * @param {import('better-sqlite3').Database} banco - Conexao ao banco.
 * @param {number} autorId - ID do usuario que cadastrou.
 * @param {string} titulo - Nome do objeto encontrado.
 * @param {string} descricao - Descricao do objeto.
 * @param {string} local - Onde o objeto foi encontrado.
 * @returns {number} ID do item criado ou ja existente.
 */
function garantirItem(banco, autorId, titulo, descricao, local) {
  const existente = banco.prepare(
    'SELECT id FROM itens WHERE titulo = ? AND cadastrado_por = ?'
  ).get(titulo, autorId);
  if (existente) return existente.id;
  const resultado = banco.prepare(`
    INSERT INTO itens (titulo, descricao, local_encontrado, data_encontro, cadastrado_por)
    VALUES (?, ?, ?, ?, ?)
  `).run(titulo, descricao, local, '2026-11-20', autorId);
  return Number(resultado.lastInsertRowid);
}

/**
 * Cria as estruturas SQL e popula o banco de forma repetivel.
 * @returns {void}
 * @throws {Error} Se o schema nao puder ser executado.
 */
function executarSeed() {
  const banco = abrirBanco();
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    banco.exec(schema);
    banco.transaction(() => {
      const senhaDemo = 'Teste@1234'; // Credencial publica de DEMONSTRACAO, nunca usar em producao.
      const adminId = garantirUsuario(banco, 'Admin Exemplo', 'admin@findit.local', 'administrador', senhaDemo);
      const usuarioId = garantirUsuario(banco, 'Pessoa Exemplo', 'usuario@findit.local', 'usuario', senhaDemo);
      const chaveiroId = garantirItem(banco, adminId, 'Chaveiro azul', 'Chaveiro com duas chaves.', 'Biblioteca');
      garantirItem(banco, usuarioId, 'Garrafa preta', 'Garrafa termica preta.', 'Bloco A');
      banco.prepare(`
        INSERT OR IGNORE INTO solicitacoes (item_id, solicitante_id, mensagem)
        VALUES (?, ?, ?)
      `).run(chaveiroId, usuarioId, 'Acredito que este chaveiro seja meu.');
    })();
    console.log('Banco criado/atualizado com dados ficticios de demonstracao.');
  } finally {
    banco.close();
  }
}

executarSeed();
