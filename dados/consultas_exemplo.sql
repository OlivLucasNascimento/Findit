-- FindIt - exemplos previstos de JOIN e agregacao para a etapa 2.
-- CONSULTA 1: solicitações com titulo do objeto e nome do solicitante.
SELECT s.id, i.titulo, u.nome AS solicitante, s.status
FROM solicitacoes AS s
JOIN itens AS i ON i.id = s.item_id
JOIN usuarios AS u ON u.id = s.solicitante_id
ORDER BY s.id;

-- CONSULTA 2: quantidade de solicitacoes por item, inclusive itens sem solicitacao.
SELECT i.id, i.titulo, COUNT(s.id) AS total_solicitacoes
FROM itens AS i
LEFT JOIN solicitacoes AS s ON s.item_id = i.id
GROUP BY i.id, i.titulo
ORDER BY total_solicitacoes DESC, i.id;
