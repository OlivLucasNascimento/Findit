/**
 * FindIt - middlewares e erros HTTP (camada de rotas).
 * Centraliza respostas previsiveis sem revelar detalhes de banco e credenciais.
 */

/** Erro esperado de validacao/autorizacao para apresentar status correto ao cliente. */
class ErroHttp extends Error {
  /**
   * @param {number} status Codigo HTTP apropriado.
   * @param {string} mensagem Mensagem publica resumida.
   */
  constructor(status, mensagem) {
    super(mensagem);
    this.name = 'ErroHttp';
    this.status = status;
  }
}

/**
 * Devolve 404 para endpoint inexistente.
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @returns {void} Resposta JSON.
 */
function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: 'Rota nao encontrada.' });
}

/**
 * Padroniza erros HTTP e impede vazamento de stacktrace para o navegador.
 * @param {Error} erro Falha encaminhada por rotas e servicos.
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Continuidade do Express.
 * @returns {void} Resposta de erro ou delegacao.
 */
function tratarErro(erro, req, res, next) {
  if (res.headersSent) return next(erro);
  if (erro instanceof ErroHttp) {
    res.status(erro.status).json({ erro: erro.message });
    return;
  }
  if (erro.type === 'entity.parse.failed') {
    res.status(400).json({ erro: 'JSON invalido.' });
    return;
  }
  if (erro.type === 'entity.too.large') {
    res.status(413).json({ erro: 'Corpo da requisicao muito grande.' });
    return;
  }
  console.error('[FindIt] Erro interno:', erro.message);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { ErroHttp, rotaNaoEncontrada, tratarErro };
