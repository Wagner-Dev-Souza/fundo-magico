/**
 * Fluxo de geração.
 *
 * A chamada ao webhook é INTERCEPTADA — nenhuma requisição sai para a internet.
 * Além de deixar o teste confiável, é isso que permite exercitar o que a página
 * tem de mais interessante: o **parser tolerante** (aceita vários formatos de
 * resposta), o **tratamento de erro** e a **sanitização** do HTML recebido.
 */
const WEBHOOK = 'http://localhost:9099/webhook/**';

const { interceptarConfig } = require('../support/configuracao');

describe('Geração do background', () => {
  beforeEach(() => {
    interceptarConfig();
    cy.visit('/');
  });

  it('avisa e não chama o webhook quando a descrição está vazia', () => {
    cy.intercept('POST', WEBHOOK, { statusCode: 200, body: {} }).as('pedido');

    cy.get('#generate-btn').click();

    cy.get('#status-message')
      .should('be.visible')
      .and('contain.text', 'Descreva o background');
    cy.get('@pedido.all').should('have.length', 0);
  });

  it('envia a descrição digitada no corpo da requisição', () => {
    cy.intercept('POST', WEBHOOK, {
      statusCode: 200,
      body: { code: '<div class="bg"></div>', style: '.bg { background: black }' }
    }).as('pedido');

    cy.get('#description').type('um céu estrelado');
    cy.get('#generate-btn').click();

    cy.wait('@pedido').its('request.body').should('deep.equal', { description: 'um céu estrelado' });
  });

  it('aplica o resultado: prévia, código exibido e CSS injetado na página', () => {
    cy.intercept('POST', WEBHOOK, {
      statusCode: 200,
      body: { code: '<div class="bg"></div>', style: '.bg { background: linear-gradient(black, navy) }' }
    }).as('pedido');

    cy.get('#description').type('céu noturno');
    cy.get('#generate-btn').click();
    cy.wait('@pedido');

    // A caixa de prévia passa de "display: none" para visível. Ela é verificada
    // pelo estilo — e não por `be.visible` — porque a altura dela depende do
    // HTML gerado: sem tamanho definido, a caixa fica com altura zero.
    // Ver a seção de limitações do README.
    cy.get('#preview-section').should('have.css', 'display', 'block');
    cy.get('#preview-section').should('contain.html', 'class="bg"');
    cy.get('#html-code').should('contain.text', 'div class="bg"');
    cy.get('#css-code').should('contain.text', 'linear-gradient');
    cy.get('#status-message').should('contain.text', 'sucesso');

    // O CSS recebido é injetado de verdade na página (é o "fundo mágico").
    cy.get('head style#dynamic-style').should('contain.text', 'linear-gradient(black, navy)');
  });

  describe('parser tolerante — aceita formatos diferentes de resposta', () => {
    const casos = [
      { nome: 'chaves code/style (contrato documentado)', corpo: { code: '<b>a</b>', style: '.a{}' } },
      { nome: 'chaves html/css', corpo: { html: '<b>b</b>', css: '.b{}' } },
      { nome: 'array com um item (padrão do nó Webhook)', corpo: [{ code: '<b>c</b>', style: '.c{}' }] },
      { nome: 'resposta embrulhada em data', corpo: { data: { code: '<b>d</b>', style: '.d{}' } } }
    ];

    casos.forEach((caso) => {
      it(`aceita ${caso.nome}`, () => {
        cy.intercept('POST', WEBHOOK, { statusCode: 200, body: caso.corpo }).as('pedido');

        cy.get('#description').type('qualquer coisa');
        cy.get('#generate-btn').click();
        cy.wait('@pedido');

        cy.get('#status-message').should('contain.text', 'sucesso');
        cy.get('#preview-section').should('be.visible');
      });
    });
  });

  it('mostra erro claro quando o servidor responde com falha, sem deixar prévia antiga na tela', () => {
    cy.intercept('POST', WEBHOOK, { statusCode: 500, body: 'erro interno' }).as('pedido');

    cy.get('#description').type('qualquer coisa');
    cy.get('#generate-btn').click();
    cy.wait('@pedido');

    cy.get('#status-message')
      .should('be.visible')
      .and('contain.text', '500');
    cy.get('#preview-section').should('not.be.visible');
    cy.get('#html-code').should('be.empty');
  });

  it('remove script do HTML recebido antes de exibir a prévia', () => {
    cy.intercept('POST', WEBHOOK, {
      statusCode: 200,
      body: {
        code: '<div class="bg">ok</div><script>window.foiInjetado = true;</script>',
        style: '.bg { background: black }'
      }
    }).as('pedido');

    cy.get('#description').type('tentativa de injeção');
    cy.get('#generate-btn').click();
    cy.wait('@pedido');

    cy.get('#preview-section').should('be.visible');
    cy.get('#preview-section script').should('not.exist');
    cy.window().then((win) => {
      expect(win.foiInjetado, 'o script recebido não pode ter sido executado').to.be.undefined;
    });
  });

  it('bloqueia o botão e avisa que está gerando, enquanto espera a resposta', () => {
    cy.intercept('POST', WEBHOOK, {
      statusCode: 200,
      delay: 1200,
      body: { code: '<div></div>', style: 'body{}' }
    }).as('pedido');

    cy.get('#description').type('algo demorado');
    cy.get('#generate-btn').click();

    // durante a espera, o usuário não pode disparar outra geração
    cy.get('#generate-btn').should('be.disabled');
    cy.get('#btn-text').should('have.text', 'Gerando Background...');
    cy.get('#status-message').should('contain.text', 'Gerando');

    cy.wait('@pedido');
    cy.get('#generate-btn').should('not.be.disabled');
    cy.get('#btn-text').should('have.text', 'Gerar Background Mágico');
  });
});
