import { inflateRawSync } from 'node:zlib';

// Lê uma entrada de dentro de um .docx sem depender de biblioteca externa:
// o .docx é um zip, então caçamos a entrada direto no formato ZIP (Fim do
// Diretório Central -> Diretório Central -> Cabeçalho Local) e descomprimimos
// com o zlib que já vem no Node — não precisa de "unzip" no servidor nem de
// nenhum pacote de terceiros.
function lerEntradaZip(buffer, nomeAlvo) {
  const ASSINATURA_FIM_DIRETORIO = 0x06054b50;
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === ASSINATURA_FIM_DIRETORIO) { eocd = i; break; }
  }
  if (eocd === -1) throw new Error('O arquivo não parece ser um .docx válido.');

  const totalEntradas = buffer.readUInt16LE(eocd + 10);
  let offsetCD = buffer.readUInt32LE(eocd + 16);

  for (let i = 0; i < totalEntradas; i++) {
    if (buffer.readUInt32LE(offsetCD) !== 0x02014b50) {
      throw new Error('O arquivo não parece ser um .docx válido.');
    }

    const metodoCompressao = buffer.readUInt16LE(offsetCD + 10);
    const tamanhoComprimido = buffer.readUInt32LE(offsetCD + 20);
    const tamanhoNome = buffer.readUInt16LE(offsetCD + 28);
    const tamanhoExtra = buffer.readUInt16LE(offsetCD + 30);
    const tamanhoComentario = buffer.readUInt16LE(offsetCD + 32);
    const offsetLocal = buffer.readUInt32LE(offsetCD + 42);
    const nome = buffer.toString('utf8', offsetCD + 46, offsetCD + 46 + tamanhoNome);

    if (nome === nomeAlvo) {
      const nomeLocalTam = buffer.readUInt16LE(offsetLocal + 26);
      const extraLocalTam = buffer.readUInt16LE(offsetLocal + 28);
      const inicioDados = offsetLocal + 30 + nomeLocalTam + extraLocalTam;
      const dados = buffer.subarray(inicioDados, inicioDados + tamanhoComprimido);
      if (metodoCompressao === 0) return dados;
      if (metodoCompressao === 8) return inflateRawSync(dados);
      throw new Error('Formato de compressão do .docx não suportado.');
    }

    offsetCD += 46 + tamanhoNome + tamanhoExtra + tamanhoComentario;
  }
  return null;
}

// Tira as tags do XML do Word e devolve só o texto legível: quebra de linha
// a cada parágrafo (</w:p>) e tabulação nos <w:tab/>.
function limparXmlWord(xml) {
  return xml
    .replace(/<\/w:p>/g, '\n')
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extrairTextoDocx(buffer) {
  const xmlBuffer = lerEntradaZip(buffer, 'word/document.xml');
  if (!xmlBuffer) throw new Error('Não encontrei o conteúdo do documento dentro do arquivo.');
  return limparXmlWord(xmlBuffer.toString('utf8'));
}
