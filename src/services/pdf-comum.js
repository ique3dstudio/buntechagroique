import path from 'node:path';
import fs from 'node:fs';

// Elementos compartilhados pelos documentos em PDF (proposta comercial e
// relatório de visita), pra os dois saírem com a mesma identidade.

export const AZUL = '#0B6FB0';
export const CINZA_TEXTO = '#4b5b57';
export const CINZA_ROTULO = '#6c7f7a';
export const BORDA = '#dfe7e5';
export const TINTA = '#142420';

export const MARGEM = 40;
export const LARGURA_CONTEUDO = 595.28 - MARGEM * 2;
export const DIREITA = MARGEM + LARGURA_CONTEUDO;
// Precisa sobrar espaço até a margem de baixo (841.89 - 40 = 801.89): se a
// última linha do rodapé passar disso, o pdfkit cria uma página extra em
// branco pra cada página do documento.
export const RODAPE_Y = 762;

const LOGO = path.join(process.cwd(), 'public', 'logo.png');

export const moeda = (valor) =>
  (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const numero = (valor) =>
  (Number(valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const texto = (valor, limite = 300) => String(valor ?? '').trim().slice(0, limite);

export function rotulo(doc, str, x, y, largura) {
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(CINZA_ROTULO)
    .text(String(str).toUpperCase(), x, y, { width: largura, characterSpacing: 0.4 });
}

export function cabecalhoDocumento(doc, { emitente = {}, titulo, subtitulo, data }) {
  if (fs.existsSync(LOGO)) doc.image(LOGO, MARGEM, MARGEM, { width: 100 });

  doc.font('Helvetica-Bold').fontSize(10).fillColor(TINTA)
    .text(texto(emitente.nome), MARGEM + 115, MARGEM + 2, { width: 195 });
  doc.font('Helvetica').fontSize(8).fillColor(CINZA_TEXTO)
    .text([emitente.cnpj && `CNPJ ${texto(emitente.cnpj)}`, texto(emitente.endereco), texto(emitente.telefone)]
      .filter(Boolean).join('\n'), MARGEM + 115, doc.y + 1, { width: 195, lineGap: 1 });

  const xDireita = 350;
  doc.font('Helvetica-Bold').fontSize(13).fillColor(AZUL)
    .text(titulo, xDireita, MARGEM + 2, { width: DIREITA - xDireita, align: 'right' });
  if (subtitulo) {
    doc.font('Helvetica-Bold').fontSize(11).fillColor(TINTA)
      .text(texto(subtitulo, 60), xDireita, doc.y + 2, { width: DIREITA - xDireita, align: 'right' });
  }
  if (data) {
    doc.font('Helvetica').fontSize(8.5).fillColor(CINZA_TEXTO)
      .text(data, xDireita, doc.y + 1, { width: DIREITA - xDireita, align: 'right' });
  }

  const y = Math.max(doc.y + 8, MARGEM + 72);
  doc.moveTo(MARGEM, y).lineTo(DIREITA, y).lineWidth(1.5).strokeColor(AZUL).stroke();
  return y + 14;
}

// Corta o texto no que cabe na largura, com reticências. O bloco tem altura
// calculada por número de linhas, então uma linha que quebrasse sozinha
// escreveria por cima da seguinte.
function truncarParaLargura(doc, str, largura) {
  let valor = texto(str);
  if (doc.widthOfString(valor) <= largura) return valor;
  while (valor.length > 1 && doc.widthOfString(`${valor}…`) > largura) {
    valor = valor.slice(0, -1);
  }
  return `${valor.trimEnd()}…`;
}

export function blocoDocumento(doc, x, y, largura, titulo, linhas) {
  const conteudo = linhas.filter(Boolean);
  const altura = 26 + conteudo.length * 11.5;
  doc.roundedRect(x, y, largura, altura, 3).lineWidth(0.8).strokeColor(BORDA).stroke();

  rotulo(doc, titulo, x + 10, y + 8, largura - 20);
  let linhaY = y + 21;
  conteudo.forEach((linha, i) => {
    doc.font(i === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(i === 0 ? 10 : 8.5).fillColor(TINTA);
    doc.text(truncarParaLargura(doc, linha, largura - 20), x + 10, linhaY, { width: largura - 20, lineBreak: false });
    linhaY += i === 0 ? 13 : 11;
  });
  return altura;
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
