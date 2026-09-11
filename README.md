# 🎨 Fundo Mágico

Gere **backgrounds para páginas web usando IA**: descreva em português o que você imagina
e o app devolve o **HTML + CSS** prontos, aplicando o resultado ao vivo como prévia.

![stack](https://img.shields.io/badge/stack-HTML%20%2B%20CSS%20%2B%20JS-yellow)

## Como funciona

```
[Você descreve o fundo] → [Webhook n8n] → [IA gera HTML/CSS] → [Prévia aplicada na hora]
```

1. Você escreve a descrição (ex.: *"um gradiente que vai do azul claro para o azul escuro"*).
2. O front-end faz `POST` para um **webhook do n8n** com `{ "description": "..." }`.
3. O workflow do n8n chama a IA e responde com `{ "code": "<html...>", "style": "<css...>" }`.
4. A página exibe o HTML e o CSS gerados e **injeta o CSS** para você ver o fundo na hora.

## Estrutura

```
index.html              # Página única
src/js/index.js         # Lógica (fetch + tratamento de resposta + prévia)
src/css/reset.css       # Reset básico
src/css/estilos.css     # Estilos da interface
src/css/responsivo.css  # Ajustes para telas pequenas
src/images/bg.JPG       # Imagem de fundo padrão
```

## Rodando localmente

Como o projeto usa `fetch`, **não abra o `index.html` direto pelo disco** (`file://`) —
alguns navegadores bloqueiam a requisição por CORS. Suba um servidor simples:

```bash
# Python 3
python3 -m http.server 3000

# ou Node
npx serve .
```

Depois acesse `http://localhost:3000`.

## Contrato da API (webhook n8n)

**Requisição:**

```http
POST /webhook/<id>
Content-Type: application/json

{ "description": "um gradiente do roxo para o rosa" }
```

**Resposta esperada (200):**

```json
{ "code": "<div class=\"bg\"></div>", "style": ".bg { background: linear-gradient(...) }" }
```

O front-end também aceita variações comuns (`{ html, css }`, array `[ { ... } ]` ou
`{ data: { ... } }`) — veja `parsePayload()` em `src/js/index.js`.

## 🔧 Solução de problemas

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| "Servidor respondeu com erro HTTP 500" | **Workflow do n8n com falha de execução** | Abra o n8n → *Executions* e veja qual nó falhou (geralmente credencial da IA expirada ou nó "Respond to Webhook" mal configurado) |
| "Não foi possível conectar ao servidor" | Rede/CORS/webhook offline | Confira se o webhook está ativo e se a origem está permitida nas opções do nó Webhook |
| "demorou demais e foi cancelada" | IA não respondeu em 60s | Aumente `REQUEST_TIMEOUT_MS` ou otimize o prompt/modelo no n8n |
| "resposta não contém HTML/CSS no formato esperado" | Workflow devolvendo outro formato | Ajuste o nó de resposta para `{ code, style }` |

## 🐛 Correções e melhorias aplicadas

- **Falha silenciosa corrigida**: o código antigo não checava `response.ok` — um erro 500
  do n8n passava batido e a página ficava vazia sem avisar ninguém. Agora há mensagens
  de erro visíveis e específicas.
- **Timeout de requisição** (`AbortController`, 60s) — a interface não trava mais.
- **Botão desabilitado durante a geração** — evita cliques duplos e requisições concorrentes.
- **Limpeza do fundo anterior** em caso de erro — antes, o CSS de uma geração antiga
  ficava preso na página.
- **Parser tolerante de resposta** — aceita `{code,style}`, `{html,css}`, arrays do n8n
  e respostas embrulhadas em `{data}`.
- **Sanitização do HTML da IA** (removação de `<script>`) antes de injetar no preview.
- **Botões "Copiar"** para o HTML e o CSS gerados.
- **Acessibilidade**: `<label>` no campo, `aria-live` para o status e `aria-busy` no botão.
- **URL do webhook centralizada** em uma constante no topo do JS.

## 💡 Próximos passos sugeridos

- [ ] Tornar a URL do webhook configurável por variável de ambiente/arquivo `.env`.
- [ ] Renderizar a prévia em um `<iframe sandbox>` para isolar totalmente o CSS gerado.
- [ ] Histórico de gerações (salvar as últimas N na `localStorage`).
- [ ] Botão "restaurar fundo original" para limpar o resultado.
- [ ] Testes automatizados (ex.: Playwright) cobrindo o fluxo de sucesso e de erro.
- [ ] Verificar no n8n por que o workflow retorna 500 e adicionar tratamento de erro
      no próprio workflow (nó de erro → responder mensagem amigável).
