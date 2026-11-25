/**
 * FindIt - integracao da interface de autenticacao com a API (camada front-end).
 * Exibe estados de tela e usa textContent para nunca interpretar resposta da API como HTML.
 */
const estadoApi = document.getElementById('estado-api');
const formularioLogin = document.getElementById('form-login');
const formularioCadastro = document.getElementById('form-cadastro');
const estadoLogin = document.getElementById('estado-login');
const estadoCadastro = document.getElementById('estado-cadastro');
const painelUsuario = document.getElementById('painel-usuario');
const usuarioAtual = document.getElementById('usuario-atual');
const botaoAdmin = document.getElementById('botao-admin');
const estadoAdmin = document.getElementById('estado-admin');
let tokenEmMemoria = null;

/** Atualiza mensagem sem inserir HTML externo ou nao confiavel. */
function mostrarEstado(elemento, mensagem, tipo = '') {
  elemento.textContent = mensagem;
  elemento.dataset.tipo = tipo;
}

/**
 * Faz uma chamada JSON e converte respostas HTTP de erro em mensagens de formulario.
 * @param {string} url Endpoint da API.
 * @param {RequestInit} opcoes Configuracao do fetch.
 * @returns {Promise<any>} JSON recebido.
 */
async function chamarApi(url, opcoes = {}) {
  const resposta = await fetch(url, opcoes);
  const json = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(json.erro || `Erro HTTP ${resposta.status}`);
  return json;
}

/**
 * Consulta a saude da API, incluindo carregamento e erro de conexao.
 * @returns {Promise<void>}
 */
async function verificarApi() {
  estadoApi.textContent = 'Carregando...';
  try {
    const dados = await chamarApi('/api/saude');
    estadoApi.textContent = dados.status === 'ok' ? 'Servidor e banco conectados.' : 'Resposta inesperada.';
  } catch (_) {
    estadoApi.textContent = 'Não foi possível conectar à API. Confira o terminal.';
  }
}

/**
 * Evita cliques duplos enquanto o cadastro e enviado.
 * @param {SubmitEvent} evento Envio do formulario.
 * @returns {Promise<void>}
 */
async function enviarCadastro(evento) {
  evento.preventDefault();
  const botao = formularioCadastro.querySelector('button[type="submit"]');
  if (botao.disabled) return;
  botao.disabled = true;
  mostrarEstado(estadoCadastro, 'Cadastrando...');
  try {
    const dados = await chamarApi('/api/auth/cadastro', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: document.getElementById('cadastro-nome').value,
        email: document.getElementById('cadastro-email').value,
        senha: document.getElementById('cadastro-senha').value
      })
    });
    mostrarEstado(estadoCadastro, `Conta de ${dados.usuario.nome} criada. Agora faça login.`, 'sucesso');
    formularioCadastro.reset();
  } catch (erro) {
    mostrarEstado(estadoCadastro, erro.message, 'erro');
  } finally {
    botao.disabled = false;
  }
}

/**
 * Envia credenciais, guarda o JWT apenas em memoria durante a sessao da pagina.
 * @param {SubmitEvent} evento Envio do formulario.
 * @returns {Promise<void>}
 */
async function enviarLogin(evento) {
  evento.preventDefault();
  const botao = formularioLogin.querySelector('button[type="submit"]');
  if (botao.disabled) return;
  botao.disabled = true;
  mostrarEstado(estadoLogin, 'Entrando...');
  try {
    const dados = await chamarApi('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('login-email').value,
        senha: document.getElementById('login-senha').value
      })
    });
    tokenEmMemoria = dados.token;
    painelUsuario.hidden = false;
    usuarioAtual.textContent = `${dados.usuario.nome} — perfil: ${dados.usuario.papel}`;
    botaoAdmin.hidden = dados.usuario.papel !== 'administrador';
    mostrarEstado(estadoAdmin, '');
    mostrarEstado(estadoLogin, 'Login efetuado com sucesso.', 'sucesso');
    // Limpa a senha para que ela nao permaneça na pagina apos autenticar.
    document.getElementById('login-senha').value = '';
  } catch (erro) {
    tokenEmMemoria = null;
    painelUsuario.hidden = true;
    mostrarEstado(estadoLogin, erro.message, 'erro');
  } finally {
    botao.disabled = false;
  }
}

/**
 * Consulta um recurso acessivel apenas ao administrador autenticado.
 * @returns {Promise<void>}
 */
async function consultarAdmin() {
  if (!tokenEmMemoria || botaoAdmin.disabled) return;
  botaoAdmin.disabled = true;
  mostrarEstado(estadoAdmin, 'Carregando relatório...');
  try {
    const { resumo } = await chamarApi('/api/admin/relatorio', {
      headers: { Authorization: `Bearer ${tokenEmMemoria}` }
    });
    mostrarEstado(estadoAdmin,
      `Usuários: ${resumo.usuarios} · Itens: ${resumo.itens} · Solicitações: ${resumo.solicitacoes}`, 'sucesso');
  } catch (erro) {
    mostrarEstado(estadoAdmin, erro.message, 'erro');
  } finally {
    botaoAdmin.disabled = false;
  }
}

formularioCadastro.addEventListener('submit', enviarCadastro);
formularioLogin.addEventListener('submit', enviarLogin);
botaoAdmin.addEventListener('click', consultarAdmin);
document.getElementById('botao-sair').addEventListener('click', () => {
  tokenEmMemoria = null;
  painelUsuario.hidden = true;
  mostrarEstado(estadoLogin, 'Sessão encerrada.');
});
verificarApi();
