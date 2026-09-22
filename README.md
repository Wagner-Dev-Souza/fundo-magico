# 🎨 Fundo Mágico

> Descreva em português o fundo que você imagina e receba o **HTML + CSS prontos**, aplicados ao vivo como prévia na própria página.

[![CI](https://github.com/Wagner-Dev-Souza/fundo-magico/actions/workflows/ci.yml/badge.svg)](https://github.com/Wagner-Dev-Souza/fundo-magico/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
![stack](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JS%20puro-yellow)
![build](https://img.shields.io/badge/build-nenhum%20(sem%20bundler)-success)
![integração](https://img.shields.io/badge/integra%C3%A7%C3%A3o-webhook%20n8n-orange)

---

## 🎯 O problema

Ajustar fundos de página por tentativa e erro custa tempo: você escreve um gradiente,
salva, recarrega, olha, corrige. Quando o fundo é fruto de uma ideia dele ("quero algo
que lembre neblina ao amanhecer"), transformar a intenção em CSS vira uma sequência
longa de tentativas.

## 💡 A solução

Este app transforma uma descrição em texto direto no resultado aplicado:

- Você escreve a ideia em português, sem saber CSS
- O app envia para um workflow de automação que aciona uma IA
- O CSS volta e é **aplicado na hora** — você vê o fundo antes de copiar
- O HTML e o CSS ficam disponíveis em caixas de código, com botão de copiar

## 🏗️ Arquitetura

```
[Você descreve o fundo]
        ↓  POST { description }
[Webhook n8n] → [IA gera HTML/CSS]
        ↓  { code, style }
[Front-end aplica o CSS ao vivo + mostra o código]
```

**Decisões técnicas:**

| Decisão | Escolha | Por quê |
|---|---|---|
| Sem framework | JS puro | a aplicação é uma tela só; framework seria peso sem retorno |
| Sem build | arquivos direto no navegador | abrir e usar, sem etapa de compilação |
| Automação no n8n | webhook externo | trocar o modelo de IA não exige mexer no front-end |
| Parser tolerante | aceita vários formatos | o workflow pode mudar o formato sem quebrar a interface |

## 📸 Demonstração

Descreva algo como *"um gradiente que vai do azul claro para o azul escuro"*, clique em
**Gerar Background Mágico** e o fundo é aplicado na página imediatamente.

## ▶️ Como rodar

O projeto usa `fetch`, então **não abra o `index.html` direto pelo disco** (`file://`) —
alguns navegadores bloqueiam a requisição. Suba um servidor simples:

```bash
# Python 3
python -m http.server 3000

# ou Node
npx serve .
```

Depois acesse `http://localhost:3000`.

## ⚙️ Configuração

A URL do webhook **não fica no código**. Ela vive em um arquivo de configuração local:

```bash
cp src/js/config.example.js src/js/config.js   # depois preencha a URL no config.js
```

```js
// src/js/config.js  (não versionado — está no .gitignore)
window.APP_CONFIG = {
  WEBHOOK_URL: "https://<seu-servidor>/webhook/<id>"
};
```

O `index.html` carrega o `config.js` antes do `index.js`, que lê a URL de `window.APP_CONFIG`. Sem o arquivo, a página avisa na tela que falta configurar e bloqueia o botão — em vez de falhar com erro de rede genérico.

O timeout da requisição continua no topo de `src/js/index.js`:

```js
const REQUEST_TIMEOUT_MS = 60000;
```

## 📂 Estrutura

```
index.html              # página única
src/js/config.example.js  # modelo de configuração (versionado)
src/js/config.js          # configuração real (NÃO versionado — ver .gitignore)
src/js/index.js         # integração, parser de resposta e controle de estado
src/css/reset.css       # reset básico
src/css/estilos.css     # interface
src/css/responsivo.css  # telas pequenas
src/images/bg.JPG       # imagem de fundo padrão
```

## 🔌 Contrato da integração

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

Outros formatos também são aceitos (`{ html, css }`, array com um item, `{ data: { ... } }`),
tratados em `parsePayload()`.

## 🛡️ Robustez e acessibilidade

O que a interface faz para não falhar em silêncio:

- **Checagem de `response.ok`** — erro HTTP do servidor aparece como mensagem clara, não como tela vazia
- **Timeout de 60s** (`AbortController`) — a interface não trava esperando resposta
- **Botão bloqueado durante a geração** — evita cliques duplos e requisições concorrentes
- **Limpeza do resultado anterior em caso de erro** — nenhum CSS antigo fica preso na página
- **Sanitização do HTML recebido** (remoção de `<script>`) antes de injetar na prévia
- **Acessibilidade** — `<label>` no campo, `aria-live` no status e `aria-busy` no botão

## 🧪 Testes

Ainda não há testes automatizados — é a principal lacuna do projeto (ver roadmap).

## 🗺️ Roadmap

- [x] URL do webhook fora do código, em arquivo de configuração local (não versionado)
- [ ] Prévia em `<iframe sandbox>` para isolar totalmente o CSS gerado
- [ ] Histórico das últimas gerações em `localStorage`
- [ ] Botão "restaurar fundo original"
- [x] Testes automatizados cobrindo os fluxos de sucesso e de erro (Cypress + pipeline de CI)
- [ ] Definir altura mínima para a caixa de prévia

## 🧪 Testes

**16 testes ponta a ponta em Cypress**, rodando automaticamente a cada push pelo GitHub Actions.

```bash
npm install
npm run serve      # servidor local em http://localhost:8081
npm test           # roda a suíte (em outro terminal)
```

### O que a suíte cobre

**Estrutura da página** (`01-pagina.cy.js`) — título, campo de descrição, botão habilitado, estado inicial sem mensagem de status, prévia escondida e saídas de código.

**Geração** (`02-geracao.cy.js`):

- **Validação de entrada**: descrição vazia avisa o usuário e **não dispara requisição**
- **Corpo da requisição**: a descrição digitada é a que é enviada
- **Resultado aplicado**: prévia exibida, código mostrado e o CSS injetado na página
- **Parser tolerante**: os **4 formatos** de resposta aceitos são testados um a um
  (`{code,style}`, `{html,css}`, array e `{data:{...}}`)
- **Tratamento de erro**: falha HTTP do servidor produz mensagem clara e limpa a prévia
- **Segurança**: `<script>` recebido é removido antes de ir para a prévia, e o teste
  confirma que ele **não foi executado**
- **Estado de carregamento**: botão bloqueado e aviso "gerando" enquanto a resposta não chega

### Por que a suíte não toca a internet

Duas interceptações do Cypress sustentam os testes:

1. **O próprio `src/js/config.js`** é interceptado e respondido com uma URL de teste — assim a
   suíte roda igual em qualquer máquina e no pipeline, sem depender do arquivo de configuração local
2. **O webhook** é interceptado — nenhuma requisição sai para o n8n

Sem isso, os testes dependeriam de um workflow externo (que hoje pode falhar por conta própria)
e ficariam instáveis. O que está sob teste é o comportamento **da nossa página**.

## ⚠️ Limitações conhecidas

- Depende de um workflow externo no n8n — sem ele, a geração não funciona
- O workflow externo pode retornar HTTP 500; a interface informa, mas não corrige a origem
- **A caixa de prévia não tem altura mínima definida**: ela só aparece se o HTML gerado
  tiver tamanho próprio. O efeito principal (o fundo aplicado à página) funciona de qualquer
  forma — o impacto é visual, na caixa de prévia. Coberto por teste em
  `cypress/e2e/02-geracao.cy.js`
- Sem testes automatizados *(resolvido: ver seção de testes acima)*

## 🤝 Como contribuir

Issues e PRs são bem-vindos. Para mudanças maiores, abra uma issue antes.

## 📄 Licença

MIT — veja [LICENSE](LICENSE).

---

**Wagner Silva Souza** · [LinkedIn](https://linkedin.com/in/wagner-silva-souza-3a840935) · [GitHub](https://github.com/Wagner-Dev-Souza)
