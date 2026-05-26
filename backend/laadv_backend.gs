/**
 * LAADV Backend — Google Apps Script Web App
 * AKE/UFT-1.0 | BUILD: LAADV-20260526 | IC: 1.0
 *
 * Registra documentos gerados pela plataforma LAADV em:
 *   - Google Drive: subpastas organizadas por tipo
 *   - Google Sheets: abas de auditoria por categoria
 *
 * DEPLOY:
 *   Apps Script → Implantar → Nova implantação
 *   Tipo: App da Web
 *   Executar como: Eu (leonzord90@gmail.com)
 *   Quem pode acessar: Qualquer pessoa
 */

// ══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO — altere apenas os IDs abaixo
// ══════════════════════════════════════════════════════════════
const CFG = {
  DRIVE_FOLDER_ID : '1mYJcJ8pcmsfvsJnmrdtgJ8j6sWsfCWIi',
  SHEET_ID        : '1gbFEeiEI-bhUde9gKg7OYL1RN2q885tJBdqU18wPxw8',
  TIMEZONE        : 'America/Manaus',

  // tipo (vindo do frontend) → nome da subpasta no Drive
  PASTA_POR_TIPO: {
    peticao_pdf     : 'Petições',
    peticao_rtf     : 'Petições',
    relatorio       : 'Relatórios',
    memoria_calculo : 'Memória de Cálculo'
  },

  // tipo → aba da planilha
  ABA_POR_TIPO: {
    peticao_pdf     : 'Petições',
    peticao_rtf     : 'Petições',
    relatorio       : 'Relatórios',
    memoria_calculo : 'Memória de Cálculo'
  },

  // Cabeçalhos de cada aba
  HEADERS: {
    'Petições': [
      'ID','Data','Hora','Escritório','Tipo de Peça','Cliente','CPF',
      'Processo','Banco Réu','Valor da Causa (R$)','Formato','Link Drive'
    ],
    'Relatórios': [
      'ID','Data','Hora','Cliente','Processo','Tipo de Cálculo',
      'Valor Original (R$)','Valor Corrigido (R$)','Índice',
      'Data Início','Data Fim','Link Drive'
    ],
    'Memória de Cálculo': [
      'ID','Data','Hora','Cliente','Processo','Tipo','Observações','Link Drive'
    ],
    'Log Geral': [
      'ID','Data','Hora','Categoria','Escritório','Tipo','Arquivo','Link Drive'
    ]
  }
};

// ══════════════════════════════════════════════════════════════
// ENTRY POINTS
// ══════════════════════════════════════════════════════════════

/** Recebe documentos do frontend LAADV via POST */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    garantirSetup();
    const resultado = processarDocumento(payload);
    return resposta({ ok: true, ...resultado });
  } catch(err) {
    return resposta({ ok: false, erro: err.message });
  }
}

/** Health check via GET */
function doGet(e) {
  return resposta({ ok: true, servico: 'LAADV Backend v1.0', versao: '1.0.0' });
}

function resposta(dados) {
  return ContentService
    .createTextOutput(JSON.stringify(dados))
    .setMimeType(ContentService.MimeType.JSON);
}

// ══════════════════════════════════════════════════════════════
// PROCESSAMENTO
// ══════════════════════════════════════════════════════════════

function processarDocumento(payload) {
  // payload esperado:
  // {
  //   tipo: 'peticao_pdf' | 'peticao_rtf' | 'relatorio' | 'memoria_calculo',
  //   nome: 'LAADV_Cumprimento_...pdf',
  //   conteudo_base64: '<base64>',   // opcional — sem conteúdo = só log
  //   mime: 'application/pdf',
  //   metadata: { escritorio, tipo_peca, cliente, cpf, processo, banco,
  //               valor_causa, tipo_calculo, valor_original, valor_corrigido,
  //               indice, data_inicio, data_fim, obs }
  // }

  const { tipo, nome, conteudo_base64, mime, metadata = {} } = payload;
  let fileUrl = '';

  // 1. Upload do arquivo no Drive (se houver conteúdo)
  if (conteudo_base64) {
    const pasta = obterOuCriarSubpasta(CFG.PASTA_POR_TIPO[tipo] || 'Outros');
    const bytes  = Utilities.base64Decode(conteudo_base64);
    const blob   = Utilities.newBlob(bytes, mime || 'application/octet-stream', nome);
    const arquivo = pasta.createFile(blob);
    arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    fileUrl = arquivo.getUrl();
  }

  // 2. Registro na planilha
  const id = registrarNaPlanilha(tipo, nome, fileUrl, metadata);

  return { id, fileUrl };
}

// ══════════════════════════════════════════════════════════════
// DRIVE
// ══════════════════════════════════════════════════════════════

function obterOuCriarSubpasta(nomePasta) {
  const raiz     = DriveApp.getFolderById(CFG.DRIVE_FOLDER_ID);
  const iterator = raiz.getFoldersByName(nomePasta);
  return iterator.hasNext() ? iterator.next() : raiz.createFolder(nomePasta);
}

// ══════════════════════════════════════════════════════════════
// SHEETS
// ══════════════════════════════════════════════════════════════

function registrarNaPlanilha(tipo, nome, fileUrl, metadata) {
  const ss   = SpreadsheetApp.openById(CFG.SHEET_ID);
  const agora = new Date();
  const data  = Utilities.formatDate(agora, CFG.TIMEZONE, 'dd/MM/yyyy');
  const hora  = Utilities.formatDate(agora, CFG.TIMEZONE, 'HH:mm:ss');

  // ID sequencial baseado no Log Geral
  const logGeral = ss.getSheetByName('Log Geral');
  const seq      = logGeral.getLastRow(); // linha 1 = cabeçalho
  const id       = 'LAADV-' + String(seq).padStart(4, '0');

  // ── Aba específica ───────────────────────────────────────────
  const nomeAba = CFG.ABA_POR_TIPO[tipo] || 'Log Geral';
  const aba     = ss.getSheetByName(nomeAba);

  if (nomeAba === 'Petições') {
    aba.appendRow([
      id, data, hora,
      metadata.escritorio   || '',
      metadata.tipo_peca    || '',
      metadata.cliente      || '',
      metadata.cpf          || '',
      metadata.processo     || '',
      metadata.banco        || '',
      metadata.valor_causa  || '',
      tipo === 'peticao_pdf' ? 'PDF' : 'RTF',
      fileUrl
    ]);
  } else if (nomeAba === 'Relatórios') {
    aba.appendRow([
      id, data, hora,
      metadata.cliente          || '',
      metadata.processo         || '',
      metadata.tipo_calculo     || '',
      metadata.valor_original   || '',
      metadata.valor_corrigido  || '',
      metadata.indice           || '',
      metadata.data_inicio      || '',
      metadata.data_fim         || '',
      fileUrl
    ]);
  } else if (nomeAba === 'Memória de Cálculo') {
    aba.appendRow([
      id, data, hora,
      metadata.cliente  || '',
      metadata.processo || '',
      metadata.tipo     || '',
      metadata.obs      || '',
      fileUrl
    ]);
  }

  // ── Log Geral (sempre) ────────────────────────────────────────
  logGeral.appendRow([
    id, data, hora,
    nomeAba,
    metadata.escritorio || '',
    tipo,
    nome,
    fileUrl
  ]);

  return id;
}

// ══════════════════════════════════════════════════════════════
// SETUP INICIAL — cria abas e cabeçalhos se não existirem
// ══════════════════════════════════════════════════════════════

function garantirSetup() {
  const ss = SpreadsheetApp.openById(CFG.SHEET_ID);

  for (const [nomeAba, headers] of Object.entries(CFG.HEADERS)) {
    let aba = ss.getSheetByName(nomeAba);

    // Criar aba se não existir
    if (!aba) {
      aba = ss.insertSheet(nomeAba);
    }

    // Inserir cabeçalho se a aba estiver vazia
    if (aba.getLastRow() === 0) {
      const range = aba.getRange(1, 1, 1, headers.length);
      range.setValues([headers]);

      // Estilo: verde LAADV
      range.setBackground('#0B4A44');
      range.setFontColor('#FFFFFF');
      range.setFontWeight('bold');
      range.setFontSize(10);
      aba.setFrozenRows(1);

      // Largura mínima das colunas
      aba.setColumnWidth(1, 110);  // ID
      aba.setColumnWidth(2, 90);   // Data
      aba.setColumnWidth(3, 75);   // Hora
    }
  }

  // Remove Plan1/Sheet1 padrão se vazia
  ['Plan1','Sheet1','Página1','Planilha1'].forEach(nome => {
    try {
      const s = ss.getSheetByName(nome);
      if (s && s.getLastRow() === 0 && ss.getNumSheets() > 1) ss.deleteSheet(s);
    } catch(_) {}
  });
}

/**
 * Execute esta função UMA VEZ manualmente (no editor do Apps Script)
 * para garantir que as abas estejam criadas antes do primeiro uso.
 */
function setupManual() {
  garantirSetup();
  Logger.log('Setup concluído. Abas criadas na planilha.');
}
