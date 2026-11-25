/**
 * FindIt - endpoints de uso administrativo (camada de rotas).
 * Exige JWT e o papel administrador ANTES de consultar o relatorio.
 */
const express = require('express');
const { exigirAutenticacao, exigirPapel } = require('../middleware/autenticacao');
const { gerarResumo } = require('../servicos/relatorio');

const router = express.Router();
router.get('/relatorio', exigirAutenticacao, exigirPapel('administrador'), (req, res, next) => {
  try {
    res.status(200).json({ resumo: gerarResumo() });
  } catch (erro) { next(erro); }
});

module.exports = router;
