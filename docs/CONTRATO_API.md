<!-- FindIt - contrato HTTP atualizado na etapa 2; rotas futuras ainda sinalizadas. -->
# FindIt — contrato inicial da API

> **Status de desenvolvimento:** autenticação e relatório administrativo estão funcionando na etapa 2. As rotas de itens e solicitações permanecem planejadas para etapas posteriores.

| Método | Rota | Papel/permissão | Respostas esperadas | Situação |
|---|---|---|---|---|
| GET | `/api/saude` | Público | 200, 500 | **Implementada** |
| POST | `/api/auth/cadastro` | Público; papel fixado em `usuario` | 201, 400, 409 | **Implementada** |
| POST | `/api/auth/login` | Público | 200, 400, 401, 429 | **Implementada** |
| GET | `/api/auth/me` | JWT válido | 200, 401 | **Implementada** |
| GET | `/api/itens` | Público | 200 | Planejada |
| GET | `/api/itens/:id` | Público | 200, 404 | Planejada |
| POST | `/api/itens` | Autenticado | 201, 400, 401 | Planejada |
| PUT | `/api/itens/:id` | Dono do item | 200, 400, 401, 403, 404 | Planejada |
| DELETE | `/api/itens/:id` | Dono; sem solicitações | 204, 401, 403, 404, 409 | Planejada |
| PATCH | `/api/itens/:id/devolver` | **Somente o cadastrante** | 200, 401, 403, 404, 409 | Planejada |
| POST | `/api/itens/:id/solicitacoes` | Autenticado; item disponível | 201, 400, 401, 404, 409 | Planejada |
| GET | `/api/solicitacoes/minhas` | Autenticado; apenas as próprias | 200, 401 | Planejada |
| GET | `/api/solicitacoes/recebidas` | Autenticado; apenas itens próprios | 200, 401 | Planejada |
| GET | `/api/admin/relatorio` | Apenas `administrador` | 200, 401, 403 | **Implementada (totais)** |

## Contratos de exemplo

**POST `/api/auth/cadastro`:** `{ "nome": "Ana", "email": "ana@example.com", "senha": "..." }`. O cliente **não escolhe** seu papel.

**POST `/api/auth/login`:** `{ "email": "ana@example.com", "senha": "..." }`. Sucesso: `{ "token": "...", "usuario": { "id": 1, "nome": "Ana", "email": "ana@example.com", "papel": "usuario" } }`. JWT expira após 2 horas; envie `Authorization: Bearer TOKEN` nas rotas protegidas.

**GET `/api/auth/me`:** exige JWT e devolve `{ "usuario": { "id": 1, "nome": "Ana", "email": "ana@example.com", "papel": "usuario" } }`.

**GET `/api/admin/relatorio`:** exige JWT e perfil `administrador`; devolve `{ "resumo": { "usuarios": 2, "itens": 2, "solicitacoes": 1 } }` (contagens variam conforme o banco).

**POST `/api/itens`:** `{ "titulo": "Carteira marrom", "descricao": "Carteira de couro encontrada", "local_encontrado": "Biblioteca", "data_encontro": "2026-11-24" }`. O campo `cadastrado_por` é obtido **do JWT**, nunca confiado ao corpo.

**POST `/api/itens/5/solicitacoes`:** `{ "mensagem": "Acredito que seja meu objeto" }`. O `solicitante_id` vem do JWT. Sucesso 201; indisponível ou duplicado 409.

**PATCH `/api/itens/5/devolver`:** corpo opcional vazio. O servidor confere o proprietário. Sucesso: 200 e objeto atualizado; outra pessoa: 403; já devolvido: 409.

## Convenção de erro
```json
{ "erro": "Mensagem resumida para o usuario." }
```

**Interpretação dos códigos:** `400` entrada inválida; `401` falta/erro de autenticação; `403` sem permissão; `404` recurso ausente; `409` conflito com regra de negócio; `429` tentativas de login excessivas; `500` falha inesperada.

## Consultas previstas
- `JOIN` de `solicitacoes`, `itens` e `usuarios` para listar pedidos com titulo e solicitante.
- `LEFT JOIN` + `COUNT` + `GROUP BY` para contar solicitações por item (arquivo `dados/consultas_exemplo.sql`).
