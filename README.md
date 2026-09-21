# 🎨 Fundo Mágico

> Descreva em português o fundo que você imagina e receba o **HTML + CSS prontos**, aplicados ao vivo como prévia na própria página.

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

Toda a configuração fica no topo de `src/js/index.js`:

```js
const WEBHOOK_URL = "https://<seu-servidor>/webhook/<id>";
const REQUEST_TIMEOUT_MS = 60000;
```

## 📂 Estrutura

```
index.html              # página única
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

- [ ] URL do webhook via arquivo `.env` em vez de constante no código
- [ ] Prévia em `<iframe sandbox>` para isolar totalmente o CSS gerado
- [ ] Histórico das últimas gerações em `localStorage`
- [ ] Botão "restaurar fundo original"
- [ ] Testes automatizados (Playwright) cobrindo o fluxo de sucesso e de erro

## ⚠️ Limitações conhecidas

- Depende de um workflow externo no n8n — sem ele, a geração não funciona
- O workflow externo pode retornar HTTP 500; a interface informa, mas não corrige a origem
- Sem testes automatizados

## 🤝 Como contribuir

Issues e PRs são bem-vindos. Para mudanças maiores, abra uma issue antes.

## 📄 Licença

MIT — veja [LICENSE](LICENSE).

---

**Wagner Silva Souza** · [LinkedIn](https://linkedin.com/in/wagner-silva-souza-3a840935) · [GitHub](https://github.com/Wagner-Dev-Souza)
