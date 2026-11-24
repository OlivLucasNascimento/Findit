/**
 * FindIt - checagem visual da API (camada front-end).
 * Etapa 1: exibe carregando, sucesso ou erro; as telas finais virao depois.
 */
const estado = document.getElementById('estado-api');

/** Verifica a saude do servidor sem inserir HTML proveniente da API. */
async function verificarApi() {
  estado.textContent = 'Carregando...';
  try {
    const resposta = await fetch('/api/saude');
    if (!resposta.ok) throw new Error('Servidor indisponivel');
    const dados = await resposta.json();
    estado.textContent = dados.status === 'ok' ? 'Servidor e banco conectados.' : 'Resposta inesperada.';
  } catch (erro) {
    // textContent evita interpretar o conteudo recebido como HTML executavel.
    estado.textContent = 'Nao foi possivel conectar a API. Confira o terminal.';
  }
}

verificarApi();
