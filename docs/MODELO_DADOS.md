<!-- FindIt - descricao textual do esquema SQLite (etapa 1). -->
# FindIt — modelo de dados

## Entidades e relações

```text
usuarios (id PK) 1 ────── N itens (cadastrado_por FK)
usuarios (id PK) 1 ────── N solicitacoes (solicitante_id FK)
itens    (id PK) 1 ────── N solicitacoes (item_id FK)
```

| Tabela | Campos principais | Restrições importantes |
|---|---|---|
| `usuarios` | `id`, `nome`, `email`, `senha_hash`, `papel`, `criado_em` | PK; email UNIQUE; papel CHECK; NOT NULL |
| `itens` | `id`, `titulo`, `descricao`, `local_encontrado`, `data_encontro`, `status`, `cadastrado_por`, `criado_em` | PK; FK cadastrante; status CHECK |
| `solicitacoes` | `id`, `item_id`, `solicitante_id`, `mensagem`, `status`, `criado_em` | PK; 2 FKs; UNIQUE(item_id, solicitante_id); status CHECK |

### Regras que exigem lógica na camada de serviços
- **RN01:** o banco armazena o cadastrante; quem pode mudar status é decidido comparando este valor ao ID autenticado. A tabela sozinha não conhece o JWT.
- **RN02:** antes de criar solicitação, o serviço verifica o status `disponivel`; a operação deve ser transacional para resistir a atualizações simultâneas.

### Observações
- Por ser SQLite, usamos `TEXT` com datas ISO para `data_encontro`; o servidor validará a data em formato `AAAA-MM-DD`.
- As FKs são habilitadas com `PRAGMA foreign_keys = ON` em cada conexão.
- `UNIQUE(item_id, solicitante_id)` é uma restrição adicional contra solicitação duplicada.
- `dados/schema.sql` é a fonte executável do esquema; `dados/consultas_exemplo.sql` contém JOIN e agregação para demonstração.
