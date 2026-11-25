/**
 * FindIt - protecao JWT e autorizacao por papel (camada middleware).
 * Nunca confia em IDs ou papeis enviados pelo formulario; identifica a conta pelo token.
 */
const jwt = require('jsonwebtoken');
const { buscarPorId } = require('../dados/usuarios');

/**
 * Exige um JWT valido e carrega a identidade atual do banco.
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encadeia para a proxima etapa.
 * @returns {void} Retorna 401 ou popula req.usuario.
 */
function exigirAutenticacao(req, res, next) {
  const correspondencia = /^Bearer\s+(\S+)$/i.exec(req.get('Authorization') || '');
  if (!correspondencia) {
    res.status(401).json({ erro: 'Autenticacao necessaria.' });
    return;
  }
  let dados;
  try {
    dados = jwt.verify(correspondencia[1], process.env.JWT_SECRET, {
      algorithms: ['HS256'], issuer: 'findit', audience: 'findit-web'
    });
  } catch (_) {
    res.status(401).json({ erro: 'Sessao invalida ou expirada.' });
    return;
  }
  const id = Number(dados.sub);
  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(401).json({ erro: 'Sessao invalida.' });
    return;
  }
  try {
    const usuario = buscarPorId(id);
    if (!usuario) {
      res.status(401).json({ erro: 'Usuario nao encontrado.' });
      return;
    }
    req.usuario = usuario;
    next();
  } catch (erro) {
    next(erro);
  }
}

/**
 * Restringe uma rota aos papeis autorizados, apos exigirAutenticacao.
 * @param {...string} papeis Papeis autorizados na rota.
 * @returns {import('express').RequestHandler} Middleware de autorizacao.
 */
function exigirPapel(...papeis) {
  return (req, res, next) => {
    if (!req.usuario) {
      res.status(401).json({ erro: 'Autenticacao necessaria.' });
      return;
    }
    if (!papeis.includes(req.usuario.papel)) {
      res.status(403).json({ erro: 'Acesso nao autorizado para este perfil.' });
      return;
    }
    next();
  };
}

module.exports = { exigirAutenticacao, exigirPapel };
