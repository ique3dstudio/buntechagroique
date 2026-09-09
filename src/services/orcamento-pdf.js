import PDFDocument from 'pdfkit';
import {
  AZUL, TINTA, MARGEM, LARGURA_CONTEUDO, DIREITA, RODAPE_Y,
  moeda, numero, texto, rotulo, cabecalhoDocumento, blocoDocumento, rodapeDocumento, nomeArquivo,
} from './pdf-comum.js';

// Gera a proposta comercial em PDF no servidor, pra o app baixar o arquivo
// direto (sem passar pela caixa de impressão do navegador). O desenho abaixo
// espelha a pré-visualização em tela do app.

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

  let y = cabecalhoDocumento(doc, {
    emitente: dados.emitente,
    titulo: 'PROPOSTA COMERCIAL',
    subtitulo: dados.numero,
    data: dados.emitidaEm ? `Emitida em ${dados.emitidaEm}` : '',
  });

  const alturaBlocos = Math.max(
    blocoDocumento(doc, MARGEM, y, 250, 'Cliente', [
      dados.cliente.nome || '—',
      dados.cliente.cnpj && `CNPJ ${dados.cliente.cnpj}`,
      dados.cliente.endereco,
      dados.cliente.cidade,
      dados.cliente.contato && `A/C ${dados.cliente.contato}`,
    ]),
    blocoDocumento(doc, 305, y, 250, 'Vendedor responsável', [
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

  rodapeDocumento(doc, {
    emitente: dados.emitente,
    assinatura: [dados.vendedor.nome || dados.vendedor.cargo, dados.vendedor.celular].filter(Boolean).join(' · '),
  });

  doc.end();
  return doc;
}

export function nomeArquivoOrcamento(dados) {
  return nomeArquivo('Orcamento', dados.numero, dados.cliente?.nome);
}
