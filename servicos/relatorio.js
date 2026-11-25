/**
 * FindIt - caso de uso de relatorio administrativo (camada de servicos).
 * Mantem a rota HTTP separada da consulta SQL.
 */
const { obterContagens } = require('../dados/relatorio');

/**
 * Consulta totais consolidados para uma rota previamente protegida por papel.
 * @returns {{usuarios:number,itens:number,solicitacoes:number}} Resumo da base.
 * @throws {Error} Erro de persistencia.
 */
function gerarResumo() {
  return obterContagens();
}

module.exports = { gerarResumo };
