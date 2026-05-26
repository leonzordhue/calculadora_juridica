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
 *   Executar como: Eu
 *   Quem pode acessar: Qualquer pessoa
 *
 * PRIMEIRA EXECUÇÃO:
 *   Execute setupManual() no editor — cria planilha e pasta no Drive automaticamente.
 *   Após executar, veja o Log (Ctrl+Enter) para obter os links.
 */

// ══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// IDs opcionais — se vazios, o backend cria os recursos automaticamente
// ══════════════════════════════════════════════════════════════
const CFG = {
  // Deixe vazio ('') para criar automaticamente na primeira execução
  DRIVE_FOLDER_ID : '',
  SHEET_ID        : '',

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
// RECURSOS — cria automaticamente se não existirem
// ══════════════════════════════════════════════════════════════

/**
 * Obtém a planilha de auditoria.
 * Ordem de prioridade: CFG.SHEET_ID → Script Properties → criar nova.
 */
function obterOuCriarPlanilha() {
  const props = PropertiesService.getScriptProperties();

  // 1. Tenta ID fixo no CFG
  if (CFG.SHEET_ID) {
    try { return SpreadsheetApp.openById(CFG.SHEET_ID); } catch(_) {}
  }

  // 2. Tenta ID salvo de execução anterior
  const savedId = props.getProperty('LAADV_SHEET_ID');
  if (savedId) {
    try { return SpreadsheetApp.openById(savedId); } catch(_) {}
  }

  // 3. Cria nova planilha
  const ss = SpreadsheetApp.create('LAADV — Auditoria de Documentos');
  props.setProperty('LAADV_SHEET_ID', ss.getId());
  Logger.log('✅ PLANILHA CRIADA AUTOMATICAMENTE');
  Logger.log('   ID: ' + ss.getId());
  Logger.log('   Link: https://docs.google.com/spreadsheets/d/' + ss.getId());
  return ss;
}

/**
 * Obtém a pasta raiz no Drive.
 * Ordem de prioridade: CFG.DRIVE_FOLDER_ID → Script Properties → criar nova.
 */
function obterOuCriarPastaRaiz() {
  const props = PropertiesService.getScriptProperties();

  // 1. Tenta ID fixo no CFG
  if (CFG.DRIVE_FOLDER_ID) {
    try { return DriveApp.getFolderById(CFG.DRIVE_FOLDER_ID); } catch(_) {}
  }

  // 2. Tenta ID salvo de execução anterior
  const savedFolderId = props.getProperty('LAADV_FOLDER_ID');
  if (savedFolderId) {
    try { return DriveApp.getFolderById(savedFolderId); } catch(_) {}
  }

  // 3. Cria pasta na raiz do Drive
  const folder = DriveApp.createFolder('LAADV — Documentos Gerados');
  props.setProperty('LAADV_FOLDER_ID', folder.getId());
  Logger.log('✅ PASTA CRIADA AUTOMATICAMENTE');
  Logger.log('   ID: ' + folder.getId());
  Logger.log('   Link: https://drive.google.com/drive/folders/' + folder.getId());
  return folder;
}

// ══════════════════════════════════════════════════════════════
// PROCESSAMENTO
// ══════════════════════════════════════════════════════════════

function processarDocumento(payload) {
  const { tipo, nome, conteudo_base64, mime, metadata = {} } = payload;
  let fileUrl = '';

  // 1. Upload do arquivo no Drive (se houver conteúdo)
  if (conteudo_base64) {
    const pastaRaiz = obterOuCriarPastaRaiz();
    const pasta = obterOuCriarSubpasta(pastaRaiz, CFG.PASTA_POR_TIPO[tipo] || 'Outros');
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

function obterOuCriarSubpasta(pastaRaiz, nomePasta) {
  const iterator = pastaRaiz.getFoldersByName(nomePasta);
  return iterator.hasNext() ? iterator.next() : pastaRaiz.createFolder(nomePasta);
}

// ══════════════════════════════════════════════════════════════
// SHEETS
// ══════════════════════════════════════════════════════════════

function registrarNaPlanilha(tipo, nome, fileUrl, metadata) {
  const ss    = obterOuCriarPlanilha();
  const agora = new Date();
  const data  = Utilities.formatDate(agora, CFG.TIMEZONE, 'dd/MM/yyyy');
  const hora  = Utilities.formatDate(agora, CFG.TIMEZONE, 'HH:mm:ss');

  // ID sequencial baseado no Log Geral
  const logGeral = ss.getSheetByName('Log Geral');
  const seq      = logGeral ? logGeral.getLastRow() : 1;
  const id       = 'LAADV-' + String(seq).padStart(4, '0');

  // ── Aba específica ───────────────────────────────────────────
  const nomeAba = CFG.ABA_POR_TIPO[tipo] || 'Log Geral';
  const aba     = ss.getSheetByName(nomeAba);

  if (aba && nomeAba === 'Petições') {
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
  } else if (aba && nomeAba === 'Relatórios') {
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
  } else if (aba && nomeAba === 'Memória de Cálculo') {
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
  if (logGeral) {
    logGeral.appendRow([
      id, data, hora,
      nomeAba,
      metadata.escritorio || '',
      tipo,
      nome,
      fileUrl
    ]);
  }

  return id;
}

// ══════════════════════════════════════════════════════════════
// SETUP INICIAL — cria abas e cabeçalhos se não existirem
// ══════════════════════════════════════════════════════════════

function garantirSetup() {
  const ss = obterOuCriarPlanilha();

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
 * para garantir que as abas e recursos estejam criados antes do primeiro uso.
 * Após executar, veja o Log (Ctrl+Enter ou menu Executar → Registros de execução)
 * para obter os links da planilha e da pasta criadas.
 */
function setupManual() {
  garantirSetup();           // cria/configura abas da planilha
  obterOuCriarPastaRaiz();   // garante que a pasta Drive também seja criada agora

  const props = PropertiesService.getScriptProperties();
  const sheetId  = props.getProperty('LAADV_SHEET_ID')  || CFG.SHEET_ID  || '(não definido)';
  const folderId = props.getProperty('LAADV_FOLDER_ID') || CFG.DRIVE_FOLDER_ID || '(não definido)';
  Logger.log('════════════════════════════════════');
  Logger.log('LAADV Backend — Setup concluído');
  Logger.log('════════════════════════════════════');
  Logger.log('Planilha : https://docs.google.com/spreadsheets/d/' + sheetId);
  Logger.log('Pasta    : https://drive.google.com/drive/folders/' + folderId);
  Logger.log('════════════════════════════════════');
}
