/**
 * FindIt - consultas administrativas (camada de dados).
 * Agregacoes SQL calculam os totais sem expor informacoes privadas de usuarios.
 */
const { abrirBanco } = require('./conexao');

/**
 * Conta registros por recurso para demonstrar o acesso do perfil administrador.
 * @returns {{usuarios:number,itens:number,solicitacoes:number}} Contagens atuais.
 * @throws {Error} Falha na consulta ao SQLite.
 */
function obterContagens() {
  const banco = abrirBanco();
  try {
    return banco.prepare(`
      SELECT
        (SELECT COUNT(*) FROM usuarios) AS usuarios,
        (SELECT COUNT(*) FROM itens) AS itens,
        (SELECT COUNT(*) FROM solicitacoes) AS solicitacoes
    `).get();
  } finally {
    banco.close();
  }
}

module.exports = { obterContagens };
