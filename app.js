/**
 * FindIt - entrada HTTP da aplicacao (camada de apresentacao/API).
 * Etapa 1: servidor estatico, health-check e tratamento centralizado de erros.
 */
require('dotenv').config();
const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const { abrirBanco } = require('./dados/conexao');
const { tratarErro, rotaNaoEncontrada } = require('./middleware/erros');

const app = express();
app.use(helmet()); // Headers basicos de seguranca antes das rotas.
app.use(express.json({ limit: '20kb' })); // Limita corpos excessivos.
app.use(express.static(path.join(__dirname, 'publico')));

/** Endpoint simples para verificar o servidor e o banco na etapa 1. */
app.get('/api/saude', (req, res, next) => {
  try {
    const banco = abrirBanco();
    banco.prepare('SELECT 1 FROM usuarios LIMIT 1').get();
    banco.close();
    res.status(200).json({ status: 'ok', projeto: 'FindIt', etapa: 1 });
  } catch (erro) {
    // Falhar explicitamente quando o banco ainda nao foi preparado com npm run seed.
    next(new Error('Banco nao inicializado. Execute npm run seed antes de iniciar o servidor.'));
  }
});

// As demais rotas REST sao CONTRATO PLANEJADO e serao implementadas na etapa 2.
app.use('/api', rotaNaoEncontrada);
app.use(tratarErro);

const porta = Number(process.env.PORT) || 3000;
app.listen(porta, () => {
  console.log(`FindIt iniciado: http://localhost:${porta}`);
});
