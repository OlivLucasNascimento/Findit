/**
 * FindIt - middlewares de resposta HTTP (camada de rotas).
 * Centraliza erros e evita devolver detalhes internos ao cliente.
 */

/**
 * Devolve uma resposta 404 padronizada para endpoints de API inexistentes.
 * @param {import('express').Request} req - Requisicao recebida.
 * @param {import('express').Response} res - Resposta HTTP.
 * @returns {void}
 */
function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: 'Rota nao encontrada.' });
}

/**
 * Captura erros encaminhados por rotas e servicos.
 * @param {Error} erro - Erro original, registrado apenas no servidor.
 * @param {import('express').Request} req - Requisicao recebida.
 * @param {import('express').Response} res - Resposta HTTP.
 * @param {import('express').NextFunction} next - Argumento exigido pelo Express.
 * @returns {void}
 */
function tratarErro(erro, req, res, next) {
  console.error('[FindIt]', erro.message);
  if (res.headersSent) return next(erro);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { rotaNaoEncontrada, tratarErro };
