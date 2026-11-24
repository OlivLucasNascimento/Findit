<!-- FindIt - guia para executar e entender o projeto; atualizar ao longo do desenvolvimento. -->
# FindIt — Sistema Web de Achados e Perdidos

**Disciplina:** Linguagens e Tecnologias para Desenvolvimento WEB — AP2 (projeto individual).  
**Status atual:** **ETAPA 1**: modelagem, documentação, banco SQLite, seed de demonstração e página de verificação da API. **Ainda não é o MVP completo.**  
**Prazo de entrega no AVA:** 07/12/2026, até 23h59.

## 1. O que o sistema faz e regra principal
O FindIt permitirá cadastrar objetos encontrados, consultar itens e solicitar devoluções. O principal controle é que **apenas a pessoa que cadastrou um item poderá marcá-lo como devolvido**. Outra regra impede novas solicitações para itens já devolvidos. Ambas serão verificadas na camada de serviços da API nas próximas etapas.

## 2. Atores e casos de uso
- **Visitante:** consultar itens e cadastrar-se.
- **Usuário:** entrar, cadastrar/editar/excluir itens próprios, fazer solicitações e marcar item próprio como devolvido.
- **Administrador:** mesmas ações de usuário, além de consultar relatórios globais; **não** pode marcar itens de terceiros como devolvidos.

## 3. Requisitos de ambiente
- Node.js 20 ou superior e npm.
- Git para versionamento (na etapa 1, comandos abaixo).
- SQLite embutido pela biblioteca `better-sqlite3`: não é necessário instalar um servidor de banco de dados separado.

## 4. Como instalar e executar do zero
No terminal, dentro da pasta do projeto:

```bash
npm install
```

Crie o arquivo `.env` copiando `.env.example` (no Windows PowerShell: `Copy-Item .env.example .env`; no macOS/Linux: `cp .env.example .env`). Gere um segredo JWT local com:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Cole o valor na linha `JWT_SECRET=` do `.env` (necessário para a implementação de login da etapa seguinte; **não** versione `.env`). Mantenha `PORT=` e `DB_PATH=` vazios para usar as opções padrão.

```bash
npm run seed
npm start
```

Abra **http://localhost:3000**. A tela deve informar `Servidor e banco conectados.` Acesse **http://localhost:3000/api/saude** e confira o JSON `{ "status": "ok", "projeto": "FindIt", "etapa": 1 }`.

O banco local `findit.db` é criado automaticamente pelo seed e fica fora do Git. `npm run seed` pode ser executado novamente sem duplicar os dados de demonstração.

## 5. Variáveis de ambiente
| Variável | Uso | Padrão |
|---|---|---|
| `PORT` | Porta HTTP | 3000 |
| `DB_PATH` | Caminho do arquivo SQLite | `./findit.db` |
| `JWT_SECRET` | Segredo de assinatura JWT, preenchido localmente | **sem padrão** |

## 6. Usuários de teste (apenas demonstração local)
| Papel | Email | Senha |
|---|---|---|
| Administrador | `admin@findit.local` | `Teste@1234` |
| Usuário | `usuario@findit.local` | `Teste@1234` |

**Importante:** o seed armazena apenas hashes bcrypt, não senhas em texto puro. Essas contas são fictícias. Login e JWT **ainda não estão implementados na etapa 1**.

## 7. Contrato da API
- **Implementado agora:** `GET /api/saude`.
- **Rotas planejadas:** autenticação, CRUD de itens, solicitações, devolução e relatório administrativo.
- **Tabela completa** (métodos, status e permissões): [`docs/CONTRATO_API.md`](docs/CONTRATO_API.md).

## 8. Modelo de dados
- Tabelas `usuarios`, `itens`, `solicitacoes`, com PK/FK/NOT NULL/UNIQUE/CHECK.
- Esquema executável: [`dados/schema.sql`](dados/schema.sql).
- Relações e escolhas: [`docs/MODELO_DADOS.md`](docs/MODELO_DADOS.md).
- JOIN e agregação planejados: [`dados/consultas_exemplo.sql`](dados/consultas_exemplo.sql).

## 9. Regras de negócio e onde ficarão
1. **RN01 — só o cadastrante marca o item como devolvido:** a verificação será feita no serviço de itens (a implementar), usando o ID vindo do JWT; violação retorna 403.
2. **RN02 — item devolvido não recebe novas solicitações:** verificação transacional no serviço de solicitações (a implementar); violação retorna 409.

Requisitos completos e critérios de teste: [`docs/REQUISITOS.md`](docs/REQUISITOS.md).

## 10. Medidas de segurança
- **Já implementado:** `helmet()` em `app.js`, limite de JSON a 20 KB, mensagens genéricas nos erros HTTP em `middleware/erros.js`, `textContent` em `publico/app.js`, `.env` excluído do Git.
- **Ainda por implementar:** autenticação bcrypt/JWT, autorização por proprietário e por papel, validação de entradas, SQL parametrizado nas operações de CRUD, limite de tentativas de login e tratamento dos demais códigos HTTP.

## 11. Organização das pastas
```text
findit/
├── app.js
├── package.json
├── .gitignore
├── .env.example
├── README.md
├── dados/          # SQLite, esquema, seed e consultas
├── docs/           # requisitos, modelo e contrato da API
├── middleware/     # erros e futuras protecoes
├── publico/        # HTML, CSS e JS
├── rotas/          # Router do Express (proximas etapas)
├── servicos/       # regras de negocio (proximas etapas)
└── testes/         # testes (proximas etapas)
```

## 12. Processo Git para projeto individual
Mesmo em trabalho individual, usar `main` (versão estável), `develop` (integração) e `feature/...` (tarefa), com PRs de `feature/...` para `develop`. Documentar as decisões nos PRs, usar mensagens como `docs: define requisitos` e evitar um único upload na véspera. O professor pode verificar o histórico.

Ao terminar **todas** as etapas, colocar a versão final em `main`, criar a tag `ap2-entrega`, enviar a tag para o remoto e preencher o **formulário da AP2 no AVA** com repositório, hash do último commit e tema/regra principal.

## 13. Limitações atuais e previstas
- **Agora:** apenas health-check, esquema SQL, seed, consultas ilustrativas e documentação. Não há cadastro, login, CRUD, devolução ou relatório operante.
- **MVP acadêmico:** não inclui upload de fotos, chat, e-mail, verificação de identidade física ou rastreamento de localização.
- Em uma implantação real, as credenciais demonstrativas devem ser removidas e o projeto deve usar HTTPS e segredo JWT forte.
