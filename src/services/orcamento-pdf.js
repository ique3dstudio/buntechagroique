import PDFDocument from 'pdfkit';
import path from 'node:path';
import fs from 'node:fs';

// Gera a proposta comercial em PDF no servidor, pra o app baixar o arquivo
// direto (sem passar pela caixa de impressão do navegador). O desenho abaixo
// espelha a pré-visualização em tela do app.

const AZUL = '#0B6FB0';
const CINZA_TEXTO = '#4b5b57';
const CINZA_ROTULO = '#6c7f7a';
const BORDA = '#dfe7e5';
const TINTA = '#142420';

const MARGEM = 40;
const LARGURA_CONTEUDO = 595.28 - MARGEM * 2;
const DIREITA = MARGEM + LARGURA_CONTEUDO;
// Precisa sobrar espaço até a margem de baixo (841.89 - 40 = 801.89): se a
// última linha do rodapé passar disso, o pdfkit cria uma página extra em
// branco pra cada página do documento.
const RODAPE_Y = 762;

const LOGO = path.join(process.cwd(), 'public', 'logo.png');

const moeda = (valor) =>
  (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const numero = (valor) =>
  (Number(valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const texto = (valor, limite = 300) => String(valor ?? '').trim().slice(0, limite);

function rotulo(doc, str, x, y, largura) {
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(CINZA_ROTULO)
    .text(String(str).toUpperCase(), x, y, { width: largura, characterSpacing: 0.4 });
}

function desenharCabecalho(doc, dados) {
  if (fs.existsSync(LOGO)) doc.image(LOGO, MARGEM, MARGEM, { width: 100 });

  const e = dados.emitente;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(TINTA)
    .text(texto(e.nome), MARGEM + 115, MARGEM + 2, { width: 195 });
  doc.font('Helvetica').fontSize(8).fillColor(CINZA_TEXTO)
    .text([`CNPJ ${texto(e.cnpj)}`, texto(e.endereco), texto(e.telefone)].filter(Boolean).join('\n'),
      MARGEM + 115, doc.y + 1, { width: 195, lineGap: 1 });

  const xDireita = 360;
  doc.font('Helvetica-Bold').fontSize(13).fillColor(AZUL)
    .text('PROPOSTA COMERCIAL', xDireita, MARGEM + 2, { width: DIREITA - xDireita, align: 'right' });
  doc.font('Helvetica-Bold').fontSize(11).fillColor(TINTA)
    .text(texto(dados.numero, 40), xDireita, doc.y + 2, { width: DIREITA - xDireita, align: 'right' });
  doc.font('Helvetica').fontSize(8.5).fillColor(CINZA_TEXTO)
    .text(`Emitida em ${dados.emitidaEm}`, xDireita, doc.y + 1, { width: DIREITA - xDireita, align: 'right' });

  const y = Math.max(doc.y + 8, MARGEM + 72);
  doc.moveTo(MARGEM, y).lineTo(DIREITA, y).lineWidth(1.5).strokeColor(AZUL).stroke();
  return y + 14;
}

function desenharBloco(doc, x, y, largura, titulo, linhas) {
  const conteudo = linhas.filter(Boolean);
  const altura = 26 + conteudo.length * 11.5;
  doc.roundedRect(x, y, largura, altura, 3).lineWidth(0.8).strokeColor(BORDA).stroke();

  rotulo(doc, titulo, x + 10, y + 8, largura - 20);
  let linhaY = y + 21;
  conteudo.forEach((linha, i) => {
    doc.font(i === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(i === 0 ? 10 : 8.5).fillColor(TINTA)
      .text(texto(linha), x + 10, linhaY, { width: largura - 20, ellipsis: true, lineBreak: false });
    linhaY += i === 0 ? 13 : 11;
  });
  return altura;
}

function desenharCabecalhoTabela(doc, y) {
  doc.rect(MARGEM, y, LARGURA_CONTEUDO, 20).fill(AZUL);
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
  doc.text('PRODUTO', MARGEM + 8, y + 6.5, { width: 220 });
  doc.text('QTD (TON)', 268, y + 6.5, { width: 62, align: 'right' });
  doc.text('PREÇO / TON', 338, y + 6.5, { width: 82, align: 'right' });
  doc.text('TOTAL', 428, y + 6.5, { width: 119, align: 'right' });
  return y + 20;
}

function desenharItens(doc, itens, yInicial) {
  let y = desenharCabecalhoTabela(doc, yInicial);

  itens.forEach((item, i) => {
    if (y + 18 > RODAPE_Y - 20) {
      doc.addPage();
      y = desenharCabecalhoTabela(doc, MARGEM);
    }
    if (i % 2 === 1) doc.rect(MARGEM, y, LARGURA_CONTEUDO, 18).fill('#f7faf9');

    doc.font('Helvetica').fontSize(9).fillColor(TINTA);
    doc.text(texto(item.produto, 80) || '—', MARGEM + 8, y + 5, { width: 220, ellipsis: true, lineBreak: false });
    doc.text(numero(item.quantidade), 268, y + 5, { width: 62, align: 'right' });
    doc.text(moeda(item.preco), 338, y + 5, { width: 82, align: 'right' });
    doc.text(moeda(item.total), 428, y + 5, { width: 119, align: 'right' });

    doc.moveTo(MARGEM, y + 18).lineTo(DIREITA, y + 18).lineWidth(0.5).strokeColor('#e6edeb').stroke();
    y += 18;
  });

  return y;
}

function desenharTotais(doc, dados, yInicial) {
  const x = 355;
  const largura = DIREITA - x;
  let y = yInicial + 10;

  const linha = (esquerda, direita) => {
    doc.font('Helvetica').fontSize(9.5).fillColor(TINTA);
    doc.text(esquerda, x, y, { width: largura / 2 });
    doc.text(direita, x + largura / 2, y, { width: largura / 2, align: 'right' });
    y += 15;
  };

  linha('Subtotal', moeda(dados.subtotal));
  linha(
    `Frete (${dados.frete})`,
    dados.frete === 'CIF'
      ? (dados.freteValor > 0 ? moeda(dados.freteValor) : 'Incluso')
      : 'Por conta do cliente'
  );

  y += 3;
  doc.moveTo(x, y).lineTo(DIREITA, y).lineWidth(1.5).strokeColor(AZUL).stroke();
  y += 7;
  doc.font('Helvetica-Bold').fontSize(12).fillColor(AZUL);
  doc.text('Total', x, y, { width: largura / 2 });
  doc.text(moeda(dados.total), x + largura / 2, y, { width: largura / 2, align: 'right' });

  return y + 22;
}

function desenharCondicoes(doc, dados, yInicial) {
  const colunas = [
    ['Condição de pagamento', dados.pagamento || '—'],
    ['Prazo de entrega', dados.entrega || '—'],
    ['Frete', dados.frete],
    ['Validade da proposta', dados.validadeTexto || '—'],
  ];

  let y = yInicial;
  colunas.forEach(([titulo, valor], i) => {
    const x = i % 2 === 0 ? MARGEM : 305;
    if (i % 2 === 0 && i > 0) y += 30;
    rotulo(doc, titulo, x, y, 240);
    doc.font('Helvetica').fontSize(9).fillColor(TINTA)
      .text(texto(valor, 120), x, y + 11, { width: 240, ellipsis: true, lineBreak: false });
  });

  return y + 40;
}

export function gerarOrcamentoPdf(dados) {
  const doc = new PDFDocument({ size: 'A4', margin: MARGEM, bufferPages: true });

  let y = desenharCabecalho(doc, dados);

  const alturaBlocos = Math.max(
    desenharBloco(doc, MARGEM, y, 250, 'Cliente', [
      dados.cliente.nome || '—',
      dados.cliente.cnpj && `CNPJ ${dados.cliente.cnpj}`,
      dados.cliente.endereco,
      dados.cliente.cidade,
      dados.cliente.contato && `A/C ${dados.cliente.contato}`,
    ]),
    desenharBloco(doc, 305, y, 250, 'Vendedor responsável', [
      dados.vendedor.nome || '—',
      dados.vendedor.cargo,
      dados.vendedor.registro,
      dados.vendedor.celular,
      dados.vendedor.email,
      dados.vendedor.regiao && `Região: ${dados.vendedor.regiao}`,
    ])
  );

  y = desenharItens(doc, dados.itens, y + alturaBlocos + 16);
  y = desenharTotais(doc, dados, y);
  y = desenharCondicoes(doc, dados, y + 6);

  if (dados.observacoes) {
    rotulo(doc, 'Observações', MARGEM, y, LARGURA_CONTEUDO);
    doc.font('Helvetica').fontSize(9).fillColor(TINTA)
      .text(texto(dados.observacoes, 1200), MARGEM, y + 11, { width: LARGURA_CONTEUDO });
  }

  // Rodapé em todas as páginas
  const faixa = doc.bufferedPageRange();
  for (let i = 0; i < faixa.count; i++) {
    doc.switchToPage(faixa.start + i);
    doc.moveTo(MARGEM, RODAPE_Y).lineTo(DIREITA, RODAPE_Y).lineWidth(0.8).strokeColor(BORDA).stroke();
    doc.font('Helvetica').fontSize(8.5).fillColor(CINZA_TEXTO);
    doc.text(`${texto(dados.emitente.nome)} · CNPJ ${texto(dados.emitente.cnpj)}`, MARGEM, RODAPE_Y + 8, { width: 300, lineBreak: false });
    const assinatura = [dados.vendedor.nome || dados.vendedor.cargo, dados.vendedor.celular].filter(Boolean).join(' · ');
    doc.text(assinatura, 300, RODAPE_Y + 8, { width: DIREITA - 300, align: 'right', lineBreak: false });
    if (faixa.count > 1) {
      doc.fontSize(7.5).text(`Página ${i + 1} de ${faixa.count}`, MARGEM, RODAPE_Y + 21, { width: LARGURA_CONTEUDO, align: 'center', lineBreak: false });
    }
  }

  doc.end();
  return doc;
}

export function nomeArquivoOrcamento(dados) {
  const limpo = (str) => String(str ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return [`Orcamento`, limpo(dados.numero), limpo(dados.cliente?.nome)].filter(Boolean).join('-') + '.pdf';
}
