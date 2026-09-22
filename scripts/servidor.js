/**
 * Servidor estático mínimo, sem dependências.
 *
 * Por que existe: a página usa `fetch` para chamar a API de tradução, e navegador
 * bloqueia essa chamada quando o arquivo é aberto direto do disco (`file://`).
 * Também é o que a suíte E2E e o pipeline usam como alvo — assim o teste roda
 * contra um servidor de verdade, e não contra o sistema de arquivos.
 *
 * Uso: node scripts/servidor.js [porta]   (padrão: 8080)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORTA = Number(process.argv[2] || process.env.PORT || 8080);
const RAIZ = path.resolve(__dirname, '..');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const servidor = http.createServer((req, res) => {
  const caminhoUrl = decodeURIComponent(req.url.split('?')[0]);
  const relativo = caminhoUrl === '/' ? 'index.html' : caminhoUrl.replace(/^\/+/, '');
  const arquivo = path.join(RAIZ, relativo);

  // Nunca servir fora da raiz do projeto.
  if (!arquivo.startsWith(RAIZ)) {
    res.writeHead(403).end('Acesso negado');
    return;
  }

  fs.readFile(arquivo, (erro, conteudo) => {
    if (erro) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 - nao encontrado');
      return;
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream' });
    res.end(conteudo);
  });
});

servidor.listen(PORTA, () => {
  console.log(`Servidor no ar em http://localhost:${PORTA}`);
});
