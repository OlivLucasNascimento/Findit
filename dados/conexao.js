/**
 * FindIt - conexao SQLite (camada de dados).
 * Centraliza o caminho do arquivo e habilita FKs para todas as conexoes.
 */
const path = require('node:path');
const Database = require('better-sqlite3');

/**
 * Abre o banco local e ativa a verificacao de chaves estrangeiras.
 * @returns {import('better-sqlite3').Database} Instancia do banco SQLite.
 * @throws {Error} Quando nao e possivel abrir/criar o arquivo de banco.
 */
function abrirBanco() {
  const arquivo = process.env.DB_PATH || path.join(__dirname, '..', 'findit.db');
  const banco = new Database(arquivo);
  // SQLite exige habilitacao explicita das FKs por conexao.
  banco.pragma('foreign_keys = ON');
  return banco;
}

module.exports = { abrirBanco };
