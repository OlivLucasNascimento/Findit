/**
 * FindIt - testes de integracao da autenticacao (camada de testes).
 * Usam SQLite temporario isolado; nao alteram findit.db do desenvolvedor.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');

const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'findit-etapa2-'));
process.env.DB_PATH = path.join(pasta, 'teste.db');
process.env.JWT_SECRET = 'chave-exclusiva-para-testes-do-findit-123456789';
const app = require('../app');
let servidor;
let base;
let tokenUsuario;

/** Solicita um endpoint da API local e retorna resposta e JSON. */
async function requisitar(rota, method = 'GET', corpo, token) {
  const resposta = await fetch(`${base}${rota}`, {
    method,
    headers: {
      ...(corpo ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(corpo ? { body: JSON.stringify(corpo) } : {})
  });
  return { status: resposta.status, dados: await resposta.json() };
}

before(async () => {
  const banco = new Database(process.env.DB_PATH);
  banco.exec(fs.readFileSync(path.join(__dirname, '../dados/schema.sql'), 'utf8'));
  banco.prepare('INSERT INTO usuarios (nome,email,senha_hash,papel) VALUES (?,?,?,?)')
    .run('Admin de Teste', 'admin@teste.local', bcrypt.hashSync('Teste@1234', 4), 'administrador');
  banco.close();
  servidor = app.listen(0);
  await new Promise(resolve => servidor.once('listening', resolve));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  if (servidor) await new Promise(resolve => servidor.close(resolve));
  fs.rmSync(pasta, { recursive: true, force: true });
});

test('cadastro cria usuario comum, ignorando tentativa de escolher administrador', async () => {
  const r = await requisitar('/api/auth/cadastro', 'POST', {
    nome: 'Ana Teste', email: 'ANA@EXAMPLE.COM', senha: 'MinhaSenha123', papel: 'administrador'
  });
  assert.equal(r.status, 201);
  assert.equal(r.dados.usuario.papel, 'usuario');
  assert.equal(r.dados.usuario.email, 'ana@example.com');
  assert.equal(r.dados.usuario.senha_hash, undefined);
  const banco = new Database(process.env.DB_PATH);
  const registro = banco.prepare('SELECT senha_hash FROM usuarios WHERE email = ?').get('ana@example.com');
  banco.close();
  assert.notEqual(registro.senha_hash, 'MinhaSenha123');
  assert.equal(bcrypt.compareSync('MinhaSenha123', registro.senha_hash), true);
});

test('cadastro rejeita email repetido e dados invalidos', async () => {
  const repetido = await requisitar('/api/auth/cadastro', 'POST', {
    nome: 'Outra Ana', email: 'ana@example.com', senha: 'MinhaSenha123'
  });
  assert.equal(repetido.status, 409);
  const invalido = await requisitar('/api/auth/cadastro', 'POST', {
    nome: 'X', email: 'email-invalido', senha: '123'
  });
  assert.equal(invalido.status, 400);
});

test('login com senha errada retorna 401 e login correto retorna JWT', async () => {
  const errado = await requisitar('/api/auth/login', 'POST', {
    email: 'ana@example.com', senha: 'SenhaIncorreta'
  });
  assert.equal(errado.status, 401);
  const correto = await requisitar('/api/auth/login', 'POST', {
    email: 'ana@example.com', senha: 'MinhaSenha123'
  });
  assert.equal(correto.status, 200);
  assert.ok(correto.dados.token);
  tokenUsuario = correto.dados.token;
});

test('rota /me exige token e nao revela hash', async () => {
  assert.equal((await requisitar('/api/auth/me')).status, 401);
  assert.equal((await requisitar('/api/auth/me', 'GET', null, 'token-invalido')).status, 401);
  const perfil = await requisitar('/api/auth/me', 'GET', null, tokenUsuario);
  assert.equal(perfil.status, 200);
  assert.equal(perfil.dados.usuario.email, 'ana@example.com');
  assert.equal(perfil.dados.usuario.senha_hash, undefined);
});

test('usuario nao acessa relatorio e administrador acessa', async () => {
  assert.equal((await requisitar('/api/admin/relatorio', 'GET', null, tokenUsuario)).status, 403);
  const login = await requisitar('/api/auth/login', 'POST', {
    email: 'admin@teste.local', senha: 'Teste@1234'
  });
  assert.equal(login.status, 200);
  assert.equal(login.dados.usuario.papel, 'administrador');
  const resumo = await requisitar('/api/admin/relatorio', 'GET', null, login.dados.token);
  assert.equal(resumo.status, 200);
  assert.equal(resumo.dados.resumo.usuarios, 2);
  assert.equal(resumo.dados.resumo.itens, 0);
});
