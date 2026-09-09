import PDFDocument from 'pdfkit';
import {
  AZUL, AZUL_CLARO, VERDE, TINTA, MARGEM, LARGURA_CONTEUDO, RODAPE_Y,
  texto, rotulo, barraTopo, cabecalhoDocumento, blocoDocumento, alturaCartao,
  marcaDagua, rodapeDocumento, nomeArquivo,
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
  doc.on('pageAdded', () => barraTopo(doc));

  let y = cabecalhoDocumento(doc, {
    emitente: dados.emitente,
    titulo: 'RELATÓRIO DE VISITA',
    subtitulo: dados.cliente.nome,
    data: dados.dataVisita ? `Visita em ${dados.dataVisita}` : '',
  });

  const linhasCliente = [
    dados.cliente.nome || '—',
    dados.cliente.cnpj && `CNPJ ${dados.cliente.cnpj}`,
    dados.cliente.endereco,
    dados.cliente.cidade,
    dados.cliente.contato,
  ];
  const linhasVisita = [
    dados.dataVisita || '—',
    dados.km ? `${dados.km} km rodados` : null,
    dados.vendedor.nome || dados.vendedor.cargo,
    dados.vendedor.celular,
  ];
  const alturaBlocos = Math.max(alturaCartao(doc, linhasCliente, 248), alturaCartao(doc, linhasVisita, 248));
  blocoDocumento(doc, MARGEM, y, 248, 'Cliente', linhasCliente, { cor: AZUL_CLARO, altura: alturaBlocos });
  blocoDocumento(doc, 307, y, 248, 'Visita', linhasVisita, { cor: VERDE, altura: alturaBlocos });

  y += alturaBlocos + 22;

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

  if (y + 60 < RODAPE_Y) marcaDagua(doc, RODAPE_Y - 66);

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
