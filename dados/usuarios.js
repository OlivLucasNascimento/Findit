/**
 * FindIt - operacoes SQL de usuarios (camada de dados).
 * Consultas parametrizadas evitam injecao SQL e nunca retornam senha nas respostas publicas.
 */
const { abrirBanco } = require('./conexao');

/**
 * Insere uma conta com papel fixo de usuario comum.
 * O papel nao vem do formulario: um visitante nao pode se promover a administrador.
 * @param {{nome:string,email:string,senhaHash:string}} dados Dados previamente validados.
 * @returns {{id:number,nome:string,email:string,papel:string}} Conta cadastrada, sem hash.
 * @throws {Error} Erro SQL, inclusive violacao de email UNIQUE.
 */
function inserirUsuario({ nome, email, senhaHash }) {
  const banco = abrirBanco();
  try {
    const resultado = banco.prepare(`
      INSERT INTO usuarios (nome, email, senha_hash, papel)
      VALUES (?, ?, ?, 'usuario')
    `).run(nome, email, senhaHash);
    return { id: Number(resultado.lastInsertRowid), nome, email, papel: 'usuario' };
  } finally {
    banco.close();
  }
}

/**
 * Pesquisa um usuario para conferir sua senha no login; nunca envie o hash ao navegador.
 * @param {string} email Email normalizado.
 * @returns {{id:number,nome:string,email:string,senha_hash:string,papel:string}|undefined} Registro interno.
 */
function buscarPorEmail(email) {
  const banco = abrirBanco();
  try {
    return banco.prepare(`
      SELECT id, nome, email, senha_hash, papel FROM usuarios WHERE email = ?
    `).get(email);
  } finally {
    banco.close();
  }
}

/**
 * Recupera a conta atual pelo identificador obtido de um JWT validado.
 * Consulta o banco a cada requisicao protegida para respeitar a permissao atual.
 * @param {number} id Identificador validado.
 * @returns {{id:number,nome:string,email:string,papel:string}|undefined} Dados publicos da conta.
 */
function buscarPorId(id) {
  const banco = abrirBanco();
  try {
    return banco.prepare(`
      SELECT id, nome, email, papel FROM usuarios WHERE id = ?
    `).get(id);
  } finally {
    banco.close();
  }
}

module.exports = { inserirUsuario, buscarPorEmail, buscarPorId };
