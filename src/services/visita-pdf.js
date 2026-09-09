import PDFDocument from 'pdfkit';
import {
  AZUL, TINTA, MARGEM, LARGURA_CONTEUDO, DIREITA, RODAPE_Y,
  texto, rotulo, cabecalhoDocumento, blocoDocumento, rodapeDocumento, nomeArquivo,
} from './pdf-comum.js';

// Relatório de visita em PDF, gerado a partir do que foi preenchido no app -
// substitui escrever o relato fora e anexar o arquivo depois.

function secao(doc, titulo, conteudo, y) {
  if (!conteudo) return y;

  // Quebra de página quando o texto não cabe no que sobrou da folha.
  const altura = doc.font('Helvetica').fontSize(9.5).heightOfString(texto(conteudo, 4000), { width: LARGURA_CONTEUDO });
  if (y + altura + 20 > RODAPE_Y - 10) {
    doc.addPage();
    y = MARGEM;
  }

  rotulo(doc, titulo, MARGEM, y, LARGURA_CONTEUDO);
  doc.font('Helvetica').fontSize(9.5).fillColor(TINTA)
    .text(texto(conteudo, 4000), MARGEM, y + 12, { width: LARGURA_CONTEUDO, lineGap: 1.5 });

  return doc.y + 14;
}

export function gerarRelatorioVisitaPdf(dados) {
  const doc = new PDFDocument({ size: 'A4', margin: MARGEM, bufferPages: true });

  let y = cabecalhoDocumento(doc, {
    emitente: dados.emitente,
    titulo: 'RELATÓRIO DE VISITA',
    subtitulo: dados.cliente.nome,
    data: dados.dataVisita ? `Visita em ${dados.dataVisita}` : '',
  });

  const alturaBlocos = Math.max(
    blocoDocumento(doc, MARGEM, y, 250, 'Cliente', [
      dados.cliente.nome || '—',
      dados.cliente.cnpj && `CNPJ ${dados.cliente.cnpj}`,
      dados.cliente.endereco,
      dados.cliente.cidade,
      dados.cliente.contato,
    ]),
    blocoDocumento(doc, 305, y, 250, 'Visita', [
      dados.dataVisita || '—',
      dados.km ? `${dados.km} km rodados` : null,
      dados.vendedor.nome || dados.vendedor.cargo,
      dados.vendedor.celular,
    ])
  );

  y += alturaBlocos + 18;

  y = secao(doc, 'Quem participou', dados.participantes, y);
  y = secao(doc, 'Objetivo da visita', dados.objetivo, y);
  y = secao(doc, 'Como foi a visita', dados.relato, y);
  y = secao(doc, 'Próximos passos', dados.proximosPassos, y);
  y = secao(doc, 'Observações', dados.observacoes, y);

  if (dados.anexoNome) {
    rotulo(doc, 'Anexo', MARGEM, y, LARGURA_CONTEUDO);
    doc.font('Helvetica').fontSize(9).fillColor(AZUL)
      .text(texto(dados.anexoNome, 120), MARGEM, y + 12, { width: LARGURA_CONTEUDO, link: dados.anexoUrl || null });
  }

  rodapeDocumento(doc, {
    emitente: dados.emitente,
    assinatura: [dados.vendedor.nome || dados.vendedor.cargo, dados.vendedor.celular].filter(Boolean).join(' · '),
  });

  doc.end();
  return doc;
}

export function nomeArquivoRelatorio(dados) {
  return nomeArquivo('Relatorio-visita', dados.cliente?.nome, dados.dataVisita?.replace(/\//g, '-'));
}
