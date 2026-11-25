/**
 * FindIt - endpoints REST de cadastro e login (camada de rotas).
 * A logica de validacao pertence aos servicos, nao ao Router.
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const { cadastrar, entrar } = require('../servicos/autenticacao');
const { exigirAutenticacao } = require('../middleware/autenticacao');

const router = express.Router();
// Defesa adicional: evita tentativas ilimitadas de senha em uma janela curta.
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ erro: 'Muitas tentativas. Tente novamente mais tarde.' })
});

router.post('/cadastro', async (req, res, next) => {
  try {
    const usuario = await cadastrar(req.body);
    res.status(201).json({ usuario });
  } catch (erro) { next(erro); }
});

router.post('/login', limiteLogin, async (req, res, next) => {
  try {
    res.status(200).json(await entrar(req.body));
  } catch (erro) { next(erro); }
});

router.get('/me', exigirAutenticacao, (req, res) => {
  res.status(200).json({ usuario: req.usuario });
});

module.exports = router;
