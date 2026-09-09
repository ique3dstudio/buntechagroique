import PDFDocument from 'pdfkit';
import {
  AZUL, AZUL_CLARO, VERDE, VERDE_ESCURO, VERDE_FUNDO, TINTA, CINZA_TEXTO, CINZA_ROTULO, BORDA, FUNDO_CARTAO,
  MARGEM, LARGURA_CONTEUDO, DIREITA, RODAPE_Y, ICONES,
  moeda, numero, texto, rotulo, icone, barraTopo, caixaMeiaRedonda,
  cabecalhoDocumento, blocoDocumento, alturaCartao, marcaDagua, rodapeDocumento, nomeArquivo,
} from './pdf-comum.js';

// Proposta comercial em PDF, no layout aprovado pela Buntech: faixa azul/verde
// no topo, cartões de cliente e vendedor, tabela de itens com cabeçalho azul,
// quadro de totais e os quatro cartões de condições comerciais.

const COLUNAS = {
  produto: { x: MARGEM + 14, largura: 205 },
  quantidade: { x: 265, largura: 70 },
  preco: { x: 345, largura: 95 },
  total: { x: 450, largura: 91 },
};

const ALTURA_LINHA = 28;
const ALTURA_CABECALHO_TABELA = 26;

function cabecalhoTabela(doc, y) {
  caixaMeiaRedonda(doc, MARGEM, y, LARGURA_CONTEUDO, ALTURA_CABECALHO_TABELA, 6, 'topo', AZUL);
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
  const linha = (coluna, str, align) =>
    doc.text(str, COLUNAS[coluna].x, y + 9, { width: COLUNAS[coluna].largura, align, characterSpacing: 0.5 });

  linha('produto', 'PRODUTO', 'left');
  linha('quantidade', 'QTD (TON)', 'right');
  linha('preco', 'PREÇO / TON', 'right');
  linha('total', 'TOTAL', 'right');
  return y + ALTURA_CABECALHO_TABELA;
}

function desenharItens(doc, itens, yInicial) {
  let yTopo = yInicial;
  let y = cabecalhoTabela(doc, yTopo);

  itens.forEach((item, i) => {
    if (y + ALTURA_LINHA > RODAPE_Y - 30) {
      // Fecha o quadro da página atual e recomeça a tabela na próxima.
      doc.roundedRect(MARGEM, yTopo, LARGURA_CONTEUDO, y - yTopo, 6).lineWidth(0.8).strokeColor(BORDA).stroke();
      doc.addPage();
      yTopo = MARGEM + 12;
      y = cabecalhoTabela(doc, yTopo);
    }

    doc.rect(MARGEM, y, LARGURA_CONTEUDO, ALTURA_LINHA).fill(i % 2 === 0 ? '#ffffff' : '#f6fafc');

    doc.font('Helvetica-Bold').fontSize(10).fillColor(TINTA);
    doc.text(texto(item.produto, 80) || '—', COLUNAS.produto.x, y + 9,
      { width: COLUNAS.produto.largura, ellipsis: true, lineBreak: false });

    doc.font('Helvetica').fontSize(9.5).fillColor(CINZA_TEXTO);
    doc.text(numero(item.quantidade), COLUNAS.quantidade.x, y + 9.5, { width: COLUNAS.quantidade.largura, align: 'right' });
    doc.text(moeda(item.preco), COLUNAS.preco.x, y + 9.5, { width: COLUNAS.preco.largura, align: 'right' });

    doc.font('Helvetica-Bold').fontSize(10).fillColor(AZUL);
    doc.text(moeda(item.total), COLUNAS.total.x, y + 9, { width: COLUNAS.total.largura, align: 'right' });

    y += ALTURA_LINHA;
    if (i < itens.length - 1) {
      doc.moveTo(MARGEM + 12, y).lineTo(DIREITA - 12, y).lineWidth(0.5).strokeColor('#eaf2f6').stroke();
    }
  });

  doc.roundedRect(MARGEM, yTopo, LARGURA_CONTEUDO, y - yTopo, 6).lineWidth(0.8).strokeColor(BORDA).stroke();
  return y;
}

function desenharTotais(doc, dados, yInicial) {
  const x = 307;
  const largura = DIREITA - x;
  const alturaLinha = 30;
  const alturaTotal = 44;
  let y = yInicial;

  const linhaValor = (esquerda, direita, fundo) => {
    doc.rect(x, y, largura, alturaLinha).fill(fundo);
    doc.font('Helvetica').fontSize(9.5).fillColor(CINZA_TEXTO)
      .text(esquerda, x + 14, y + 10.5, { width: largura / 2, lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(TINTA)
      .text(direita, x + largura / 2 - 14, y + 10.5, { width: largura / 2, align: 'right', lineBreak: false });
    y += alturaLinha;
  };

  caixaMeiaRedonda(doc, x, y, largura, alturaLinha, 6, 'topo', '#f3f7f9');
  linhaValor('Subtotal', moeda(dados.subtotal), '#f3f7f9');
  linhaValor(
    `Frete (${dados.frete})`,
    dados.frete === 'CIF'
      ? (dados.freteValor > 0 ? moeda(dados.freteValor) : 'Incluso')
      : 'Por conta do cliente',
    '#e9f4f9'
  );

  caixaMeiaRedonda(doc, x, y, largura, alturaTotal, 6, 'baixo', AZUL);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff')
    .text('Total', x + 14, y + 14, { width: largura / 2, lineBreak: false })
    .text(moeda(dados.total), x + largura / 2 - 14, y + 14, { width: largura / 2, align: 'right', lineBreak: false });

  return y + alturaTotal;
}

// Texto curto do lado esquerdo dos totais, resumindo pra quem é a proposta.
function desenharResumo(doc, dados, y, alturaDisponivel) {
  const largura = 307 - MARGEM - 20;
  const linhas = [
    dados.cliente.nome ? `Proposta preparada para ${texto(dados.cliente.nome, 70).replace(/\.$/, '')}.` : '',
    dados.frete === 'CIF'
      ? (dados.freteValor > 0 ? 'Frete CIF cobrado à parte, conforme quadro ao lado.' : 'Frete CIF incluso no preço.')
      : 'Frete FOB por conta do cliente.',
    texto(dados.observacoes, 600),
  ].filter(Boolean);

  doc.font('Helvetica').fontSize(9).fillColor(CINZA_TEXTO)
    .text(linhas.join('\n'), MARGEM, y + 4, { width: largura, lineGap: 3, height: alturaDisponivel });
}

function cartaoCondicao(doc, { x, y, largura, altura, iconeNome, titulo, valor, complemento, destaque }) {
  doc.roundedRect(x, y, largura, altura, 6).fill(destaque ? VERDE_FUNDO : FUNDO_CARTAO);
  doc.roundedRect(x, y, largura, altura, 6).lineWidth(0.8).strokeColor(BORDA).stroke();

  icone(doc, ICONES[iconeNome], x + 12, y + 12, 16, destaque ? VERDE : AZUL_CLARO, 1.8);
  rotulo(doc, titulo, x + 34, y + 13, largura - 44, CINZA_ROTULO, 6.5);

  doc.font('Helvetica-Bold').fontSize(12).fillColor(destaque ? VERDE_ESCURO : TINTA)
    .text(texto(valor, 40) || '—', x + 12, y + altura - 34, { width: largura - 24, ellipsis: true, lineBreak: false });
  if (complemento) {
    doc.font('Helvetica').fontSize(8).fillColor(destaque ? VERDE : CINZA_TEXTO)
      .text(texto(complemento, 40), x + 12, y + altura - 17, { width: largura - 24, ellipsis: true, lineBreak: false });
  }
}

function desenharCondicoes(doc, dados, y) {
  const espaco = 8;
  const largura = (LARGURA_CONTEUDO - espaco * 3) / 4;
  const altura = 76;
  const validade = String(dados.validadeTexto || '');
  const partes = validade.match(/^(.+?)\s*\((.+)\)$/);

  const cartoes = [
    { iconeNome: 'cartao', titulo: 'Condição de pagamento', valor: dados.pagamento },
    { iconeNome: 'caminhao', titulo: 'Prazo de entrega', valor: dados.entrega },
    { iconeNome: 'frete', titulo: 'Frete', valor: dados.frete },
    {
      iconeNome: 'calendario',
      titulo: 'Validade da proposta',
      valor: partes ? partes[1] : validade,
      complemento: partes ? `(${partes[2]})` : '',
      destaque: true,
    },
  ];

  cartoes.forEach((cartao, i) => {
    cartaoCondicao(doc, { ...cartao, x: MARGEM + i * (largura + espaco), y, largura, altura });
  });

  return y + altura;
}

export function gerarOrcamentoPdf(dados) {
  const doc = new PDFDocument({ size: 'A4', margin: MARGEM, bufferPages: true });
  doc.on('pageAdded', () => barraTopo(doc));

  let y = cabecalhoDocumento(doc, {
    emitente: dados.emitente,
    titulo: 'PROPOSTA COMERCIAL',
    subtitulo: dados.numero,
    data: dados.emitidaEm ? `Emitida em ${dados.emitidaEm}` : '',
  });

  const linhasCliente = [
    dados.cliente.nome || '—',
    dados.cliente.cnpj && `CNPJ ${dados.cliente.cnpj}`,
    dados.cliente.endereco,
    dados.cliente.cidade,
    dados.cliente.contato && `A/C ${dados.cliente.contato}`,
  ];
  const linhasVendedor = [
    dados.vendedor.nome || '—',
    dados.vendedor.cargo,
    dados.vendedor.registro,
    dados.vendedor.celular,
    dados.vendedor.email,
    dados.vendedor.regiao && `Região: ${dados.vendedor.regiao}`,
  ];
  const alturaCartoes = Math.max(alturaCartao(doc, linhasCliente, 248), alturaCartao(doc, linhasVendedor, 248));
  blocoDocumento(doc, MARGEM, y, 248, 'Cliente', linhasCliente, { cor: AZUL_CLARO, altura: alturaCartoes });
  blocoDocumento(doc, 307, y, 248, 'Vendedor responsável', linhasVendedor, { cor: VERDE, altura: alturaCartoes });
  y += alturaCartoes + 24;

  // Título da seção de itens.
  icone(doc, ICONES.caixa, MARGEM, y - 3, 16, AZUL_CLARO, 1.8);
  rotulo(doc, 'Itens da proposta', MARGEM + 24, y + 1, 240, TINTA, 9);
  doc.font('Helvetica').fontSize(8.5).fillColor(CINZA_ROTULO)
    .text('Valores em reais (R$)', DIREITA - 200, y + 2, { width: 200, align: 'right' });

  y = desenharItens(doc, dados.itens, y + 20);

  const yTotais = y + 16;
  const yDepois = desenharTotais(doc, dados, yTotais);
  desenharResumo(doc, dados, yTotais, yDepois - yTotais);

  y = desenharCondicoes(doc, dados, yDepois + 26);

  if (y + 60 < RODAPE_Y) marcaDagua(doc, Math.max(y + 30, RODAPE_Y - 66));

  rodapeDocumento(doc, {
    emitente: dados.emitente,
    assinatura: ['Vendedor', dados.vendedor.celular].filter(Boolean).join(' · '),
  });

  doc.end();
  return doc;
}

export function nomeArquivoOrcamento(dados) {
  return nomeArquivo('Orcamento', dados.numero, dados.cliente?.nome);
}
