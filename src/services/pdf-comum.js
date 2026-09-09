import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Elementos compartilhados pelos documentos em PDF (proposta comercial e
// relatório de visita), pra os dois saírem com a mesma identidade: faixa
// azul/verde no topo, cartões com ícone, rodapé com a assinatura da Buntech.

export const AZUL = '#0B6FB0';
export const AZUL_CLARO = '#028ED2';
export const AZUL_FUNDO = '#EEF6FB';
export const VERDE = '#05ABA3';
export const VERDE_ESCURO = '#0B7F79';
export const VERDE_FUNDO = '#F0FBFA';
export const CINZA_TEXTO = '#4b5b63';
export const CINZA_ROTULO = '#6c7f8a';
export const BORDA = '#e3edf2';
export const FUNDO_CARTAO = '#fafcfd';
export const TINTA = '#14232a';

export const LARGURA_PAGINA = 595.28;
export const ALTURA_PAGINA = 841.89;
export const MARGEM = 40;
export const LARGURA_CONTEUDO = LARGURA_PAGINA - MARGEM * 2;
export const DIREITA = MARGEM + LARGURA_CONTEUDO;
// Precisa sobrar espaço até a margem de baixo (841.89 - 40 = 801.89): se a
// última linha do rodapé passar disso, o pdfkit cria uma página extra em
// branco pra cada página do documento.
export const RODAPE_Y = 762;

// Caminho relativo a este arquivo: o logo tem que aparecer no PDF mesmo se o
// servidor for iniciado de outra pasta.
const PASTA_PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');
const LOGO = path.join(PASTA_PUBLIC, 'logo.png');
// A folhinha recortada direto do logo da Buntech, pra marca d'água ficar
// igual à marca oficial em vez de um desenho à mão aproximado.
const MARCA_FOLHA = path.join(PASTA_PUBLIC, 'marca-folha.png');

// Ícones no mesmo traço dos que aparecem no app (viewBox 24x24).
// Cada ícone é uma lista de comandos: string = path (sintaxe SVG), e
// { circulo: [cx, cy, r] } = um círculo - os dois entram na mesma escala de
// 24x24 e no mesmo traço, então dá pra misturar num ícone só (ex: as rodas
// do caminhão, o aro do gancho no ícone de frete).
export const ICONES = {
  caixa: [
    'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z',
    'M3.3 7 12 12l8.7-5',
    'M12 22V12',
  ],
  cartao: ['M2 5h20v14H2z', 'M2 10h20'],
  // Caminhão (ícone do Lucide) - cabine + carroceria + as duas rodas.
  caminhao: [
    'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2',
    'M15 18H9',
    'M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14v10',
    { circulo: [17, 18, 2] },
    { circulo: [7, 18, 2] },
  ],
  // Frete: o mesmo desenho do modelo original (prédio com topo em ponta e
  // colunas) - a v1 tinha ficado uma casinha com porta, sem semelhança com o
  // ícone do layout enviado.
  frete: ['M4 20V9L12 4L20 9V20Z', 'M8 11V20', 'M12 5V20', 'M16 11V20'],
  calendario: ['M8 2v4', 'M16 2v4', 'M3 10h18', 'M3 4h18v18H3z'],
};

export const moeda = (valor) =>
  (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const numero = (valor) =>
  (Number(valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const texto = (valor, limite = 300) => String(valor ?? '').trim().slice(0, limite);

export function rotulo(doc, str, x, y, largura, cor = CINZA_ROTULO, tamanho = 7.5) {
  doc.font('Helvetica-Bold').fontSize(tamanho).fillColor(cor)
    .text(String(str).toUpperCase(), x, y, { width: largura, characterSpacing: 0.5 });
}

// Desenha um ícone de 24x24 (traço) na escala pedida. Cada item é um path
// (string) ou um círculo ({ circulo: [cx, cy, r] }).
export function icone(doc, comandos, x, y, tamanho, cor, espessura = 2) {
  doc.save();
  doc.translate(x, y).scale(tamanho / 24);
  doc.lineWidth(espessura).strokeColor(cor).lineJoin('round').lineCap('round');
  for (const comando of comandos) {
    if (typeof comando === 'string') doc.path(comando).stroke();
    else if (comando?.circulo) doc.circle(...comando.circulo).stroke();
  }
  doc.restore();
}

// Faixa azul -> verde no alto da folha.
export function barraTopo(doc) {
  const gradiente = doc.linearGradient(0, 0, LARGURA_PAGINA, 0);
  gradiente.stop(0, AZUL_CLARO).stop(0.55, AZUL_CLARO).stop(0.78, VERDE).stop(1, VERDE);
  doc.rect(0, 0, LARGURA_PAGINA, 8).fill(gradiente);
}

// Retângulo com cantos arredondados só de um lado (o pdfkit arredonda os
// quatro), usado no topo da tabela e no rodapé do quadro de totais.
export function caixaMeiaRedonda(doc, x, y, largura, altura, raio, lado, cor) {
  doc.roundedRect(x, y, largura, altura, raio).fill(cor);
  const metade = Math.min(raio, altura / 2);
  if (lado === 'topo') doc.rect(x, y + altura - metade, largura, metade).fill(cor);
  else doc.rect(x, y, largura, metade).fill(cor);
}

export function cabecalhoDocumento(doc, { emitente = {}, titulo, subtitulo, data, cor = AZUL }) {
  barraTopo(doc);

  const topo = MARGEM - 6;
  if (fs.existsSync(LOGO)) doc.image(LOGO, MARGEM, topo + 4, { width: 130 });

  const xEmitente = MARGEM + 148;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(TINTA)
    .text(texto(emitente.nome), xEmitente, topo + 2, { width: 190 });
  doc.font('Helvetica').fontSize(8).fillColor(CINZA_TEXTO)
    .text([emitente.cnpj && `CNPJ ${texto(emitente.cnpj)}`, texto(emitente.endereco), texto(emitente.telefone)]
      .filter(Boolean).join('\n'), xEmitente, doc.y + 2, { width: 190, lineGap: 1.5 });

  // Régua entre os dados da empresa e o título.
  const xDivisor = 372;
  doc.moveTo(xDivisor, topo).lineTo(xDivisor, topo + 74).lineWidth(1).strokeColor(BORDA).stroke();

  const xTitulo = xDivisor + 18;
  const larguraTitulo = DIREITA - xTitulo;
  doc.font('Helvetica-Bold').fontSize(19).fillColor(cor)
    .text(String(titulo).toUpperCase(), xTitulo, topo, { width: larguraTitulo, align: 'right', lineGap: -2 });

  let yPill = doc.y + 8;
  if (subtitulo) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor(TINTA)
      .text(texto(subtitulo, 60), xTitulo, doc.y + 4, { width: larguraTitulo, align: 'right' });
    yPill = doc.y + 6;
  }
  if (data) {
    const larguraPill = doc.font('Helvetica').fontSize(8.5).widthOfString(data) + 26;
    doc.roundedRect(DIREITA - larguraPill, yPill, larguraPill, 20, 10).fill(AZUL_FUNDO);
    doc.fillColor(CINZA_TEXTO)
      .text(data, DIREITA - larguraPill, yPill + 6.5, { width: larguraPill, align: 'center' });
    yPill += 20;
  }

  return Math.max(yPill + 16, topo + 96);
}

// Mede as linhas do cartão já considerando a quebra de linha, pra calcular a
// altura antes de desenhar (os dois cartões saem com a mesma altura).
function linhasDoCartao(doc, linhas, largura) {
  return linhas.filter(Boolean).map((linha, i) => {
    const destaque = i === 0;
    const str = texto(linha, 200);
    doc.font(destaque ? 'Helvetica-Bold' : 'Helvetica').fontSize(destaque ? 11.5 : 8.5);
    return { str, destaque, altura: doc.heightOfString(str, { width: largura, lineGap: 1.5 }) };
  });
}

export function alturaCartao(doc, linhas, largura) {
  const medidas = linhasDoCartao(doc, linhas, largura - 32);
  const conteudo = medidas.reduce((soma, linha) => soma + linha.altura + (linha.destaque ? 6 : 2), 0);
  return 45 + conteudo + 14;
}

// Avatar redondo com a silhueta de uma pessoa.
function avatar(doc, cx, cy, raio, cor) {
  doc.circle(cx, cy, raio).fill(cor);
  doc.circle(cx, cy - raio * 0.24, raio * 0.29).fill('#ffffff');
  const largura = raio * 0.52;
  doc.path(`M ${cx - largura} ${cy + raio * 0.62} a ${largura} ${largura} 0 0 1 ${largura * 2} 0 z`).fill('#ffffff');
}

// Cartão de informação (Cliente / Vendedor): tarja colorida no topo, avatar,
// rótulo e as linhas de dados - a primeira em destaque.
export function blocoDocumento(doc, x, y, largura, titulo, linhas, opcoes = {}) {
  const cor = opcoes.cor || AZUL_CLARO;
  const medidas = linhasDoCartao(doc, linhas, largura - 32);
  const altura = opcoes.altura || alturaCartao(doc, linhas, largura);

  doc.roundedRect(x, y, largura, altura, 6).fill(FUNDO_CARTAO);
  caixaMeiaRedonda(doc, x, y, largura, 5, 6, 'topo', cor);
  doc.roundedRect(x, y, largura, altura, 6).lineWidth(0.8).strokeColor(BORDA).stroke();

  avatar(doc, x + 27, y + 28, 11, cor);
  rotulo(doc, titulo, x + 46, y + 24.5, largura - 56);

  let linhaY = y + 45;
  medidas.forEach((linha) => {
    doc.font(linha.destaque ? 'Helvetica-Bold' : 'Helvetica').fontSize(linha.destaque ? 11.5 : 8.5)
      .fillColor(linha.destaque ? TINTA : CINZA_TEXTO);
    doc.text(linha.str, x + 16, linhaY, { width: largura - 32, lineGap: 1.5 });
    linhaY += linha.altura + (linha.destaque ? 6 : 2);
  });

  return altura;
}

// Frase de assinatura da Buntech, dividida pra caber na coluna estreita da
// marca d'água (compartilhada com a folha em HTML no app - ver SVG_ORCAMENTO).
export const TAGLINE_BUNTECH = ['MAIS QUE UM', 'REVESTIMENTO,', 'UM CARREADOR', 'DE TECNOLOGIA!'];

// Marca d'água discreta no pé da folha, como na papelaria da Buntech.
export function marcaDagua(doc, y) {
  doc.save();
  doc.lineWidth(0.8).strokeColor('#edf5f7');
  for (const raio of [34, 56, 78]) doc.circle(DIREITA + 6, y + 46, raio).stroke();
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#9fb3bd');
  TAGLINE_BUNTECH.forEach((linha, i) => {
    doc.text(linha, DIREITA - 190, y + i * 10, { width: 140, align: 'right', characterSpacing: 1.2 });
  });
  if (fs.existsSync(MARCA_FOLHA)) doc.image(MARCA_FOLHA, DIREITA - 42, y + 2, { height: 22 });
  doc.moveTo(DIREITA - 30, y + 30).lineTo(DIREITA - 8, y + 30).lineWidth(1.6).strokeColor(VERDE).stroke();
}

export function rodapeDocumento(doc, { emitente = {}, assinatura = '' }) {
  const faixa = doc.bufferedPageRange();
  for (let i = 0; i < faixa.count; i++) {
    doc.switchToPage(faixa.start + i);
    doc.moveTo(MARGEM, RODAPE_Y).lineTo(DIREITA, RODAPE_Y).lineWidth(0.8).strokeColor(BORDA).stroke();
    doc.font('Helvetica').fontSize(8.5).fillColor(CINZA_TEXTO);
    doc.text([texto(emitente.nome), emitente.cnpj && `CNPJ ${texto(emitente.cnpj)}`].filter(Boolean).join(' · '),
      MARGEM, RODAPE_Y + 8, { width: 300, lineBreak: false });
    doc.text(texto(assinatura, 90), 300, RODAPE_Y + 8, { width: DIREITA - 300, align: 'right', lineBreak: false });
    if (faixa.count > 1) {
      doc.fontSize(7.5).text(`Página ${i + 1} de ${faixa.count}`, MARGEM, RODAPE_Y + 21,
        { width: LARGURA_CONTEUDO, align: 'center', lineBreak: false });
    }
  }
}

export function nomeArquivo(...partes) {
  const limpo = (str) => String(str ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return partes.map(limpo).filter(Boolean).join('-') + '.pdf';
}
