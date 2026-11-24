<!-- FindIt - levantamento de requisitos, decisores e escopo (etapa 1). -->
# FindIt — requisitos e decisões

## Problema e objetivo
Permitir que pessoas registrem objetos encontrados e que interessados solicitem a devolução, com rastreabilidade do cadastro e controle de permissões.

## Atores
- **Visitante:** consulta a lista pública de itens e seus detalhes; pode criar conta.
- **Usuário autenticado:** cadastra e gerencia **seus próprios** itens, solicita a devolução de itens disponíveis e consulta suas solicitações.
- **Administrador:** possui as funções de usuário e visualiza relatório e solicitações globais. **Não pode** marcar como devolvido um item cadastrado por outra pessoa.

## Casos de uso mínimos
1. Criar conta, autenticar-se e obter token JWT.
2. Cadastrar, consultar, atualizar e excluir itens (CRUD completo).
3. Solicitar devolução de item disponível; consultar solicitações feitas e recebidas.
4. Marcar item próprio como devolvido.
5. Consultar painel administrativo com contagens por status.

## Regras obrigatórias verificadas no SERVIDOR
- **RN01 — propriedade:** apenas o valor `cadastrado_por` do item, comparado ao ID do JWT validado, autoriza marcar como `devolvido`. Outro usuário recebe HTTP 403, independentemente do papel. A UI não é a barreira de segurança.
- **RN02 — estado:** item com status `devolvido` rejeita nova solicitação (HTTP 409). A checagem e a gravação serão atômicas, para evitar corridas entre devolução e solicitação.

## Regras complementares simples
- Um mesmo usuário não solicita o mesmo item duas vezes: `UNIQUE(item_id, solicitante_id)` reforça a validação do servidor.
- A exclusão de item com solicitação existente será recusada com HTTP 409; a chave estrangeira protege a integridade.
- Ao marcar como devolvido, solicitações pendentes daquele item serão encerradas na mesma transação.

## Restrições deliberadas do MVP
- Sem fotos, mensagens privadas, confirmação de identidade real, notificações, geolocalização ou pagamentos.
- Um item pode ser marcado como devolvido pelo cadastrante sem um fluxo adicional de aprovação.
- Senhas de contas demonstrativas não devem ser usadas fora do ambiente acadêmico.

## Requisitos de qualidade
- API REST com Express Router, `rotas/`, `servicos/` e `dados/` separados; nenhum SQL nas rotas.
- SQLite com PK, FK, NOT NULL, UNIQUE/CHECK, JOIN e agregação.
- Query SQL parametrizada, senha bcrypt, JWT, autorização por papéis e por proprietário, validação no servidor.
- Helmet e limite de tentativas em `/api/auth/login`; tratamento centralizado de erros.
- Front-end HTML/CSS/JS com fetch, quatro estados (carregando, vazio, erro e sucesso), textContent para dados externos e prevenção de clique duplo.
- Arquivos comentados, funções de serviços/dados com JSDoc, README executável, branches e PRs, commits no padrão Conventional Commits.

## Critérios de aceite demonstráveis
1. O usuário A cadastra um item. O usuário B tenta marcar esse item como devolvido: **403**.
2. O usuário A marca o próprio item como devolvido: **200**.
3. Um usuário tenta solicitar um item devolvido: **409**.
4. O banco impede um pedido duplicado pela restrição `UNIQUE`.
5. O relatório usa `JOIN` e uma consulta de agregação `COUNT`.
