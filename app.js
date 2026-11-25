/**
 * FindIt - entrada HTTP e composicao da API (camada de apresentacao/API).
 * Etapa 2: cadastro, login JWT, perfil atual e relatorio administrativo protegido.
 */
require('dotenv').config();
const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const { abrirBanco } = require('./dados/conexao');
const { tratarErro, rotaNaoEncontrada } = require('./middleware/erros');
const rotasAutenticacao = require('./rotas/autenticacao');
const rotasAdmin = require('./rotas/admin');

const app = express();
app.disable('x-powered-by');
app.use(helmet()); // Headers de seguranca aplicados antes dos recursos.
app.use(express.json({ limit: '20kb' })); // Evita corpos JSON excessivamente grandes.
app.use(express.static(path.join(__dirname, 'publico')));

app.get('/api/saude', (req, res, next) => {
  try {
    const banco = abrirBanco();
    try { banco.prepare('SELECT 1 FROM usuarios LIMIT 1').get(); }
    finally { banco.close(); }
    res.status(200).json({ status: 'ok', projeto: 'FindIt', etapa: 2 });
  } catch (erro) {
    next(new Error('Banco nao inicializado. Execute npm run seed.'));
  }
});

app.use('/api/auth', rotasAutenticacao);
app.use('/api/admin', rotasAdmin);
app.use('/api', rotaNaoEncontrada);
app.use(tratarErro);

// Permite que os testes importem o app sem iniciar outra porta HTTP.
if (require.main === module) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('Configure JWT_SECRET no .env com pelo menos 32 caracteres.');
    process.exitCode = 1;
  } else {
    const porta = Number(process.env.PORT) || 3000;
    app.listen(porta, () => console.log(`FindIt iniciado: http://localhost:${porta}`));
  }
}

module.exports = app;
