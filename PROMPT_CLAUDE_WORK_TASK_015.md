# PROMPT — Claude-Work (Opus 4.7) | TASK-015 — Integração Backend Google Apps Script
> AKE/UFT-1.0 | PRINCIPAL → CLAUDE-WORK | Execute esta task completa.
> Projeto: LAADV Calculadora Jurídica · v1.9.3

---

## Contexto

Foi criado um backend em Google Apps Script (`backend/laadv_backend.gs`) que recebe
documentos gerados pela plataforma via `fetch()` POST e:
1. Faz upload do arquivo no Google Drive (subpasta correta)
2. Registra metadados na planilha de auditoria (Google Sheets)

O backend aceita um payload JSON com:
```json
{
  "tipo": "peticao_pdf|peticao_rtf|relatorio|memoria_calculo",
  "nome": "nome_do_arquivo.pdf",
  "conteudo_base64": "<base64 do arquivo>",
  "mime": "application/pdf",
  "metadata": {
    "escritorio": "LAADV",
    "tipo_peca": "Cumprimento de Sentença",
    "cliente": "João Silva",
    "cpf": "123.456.789-00",
    "processo": "0001234-56.2024.8.04.0001",
    "banco": "Bradesco",
    "valor_causa": "15000.00",
    "tipo_calculo": "Consignado RMC",
    "valor_original": "5000.00",
    "valor_corrigido": "6200.00",
    "indice": "IPCA",
    "data_inicio": "2022-01-01",
    "data_fim": "2024-05-01",
    "obs": ""
  }
}
```

O campo `conteudo_base64` pode ser omitido — nesse caso só registra metadados sem upload.

---

## Branch

```
git checkout main
git pull origin main
git checkout -b claude/work-backend-015
```

## Arquivos que você DEVE tocar

- `LAADV_Calculadora_Juridica_v1.html`

## Arquivos que você NÃO deve tocar

- `core/*`, `io/*`, `render/*`, `backend/*`

---

## Parte 1 — Constante de configuração do backend

No bloco `<script>` do HTML, **antes** da função `alternarTema()`, adicione:

```js
// ══════════════════════════════════════════════════════════════════════
//  TASK-015 — Backend LAADV · Google Apps Script Web App
//  AKE/UFT-1.0 | BUILD: LAADV-20260526 | IC: 1.0 | MÓDULO: BACKEND
// ══════════════════════════════════════════════════════════════════════
const LAADV_BACKEND_URL = (function(){
  try { return localStorage.getItem('laadv_backend_url') || ''; } catch(e){ return ''; }
})();

/**
 * Registra um documento gerado no backend (Drive + Sheets).
 * Fire-and-forget: falha não bloqueia o usuário.
 *
 * @param {string} tipo     - 'peticao_pdf' | 'peticao_rtf' | 'relatorio' | 'memoria_calculo'
 * @param {string} nome     - nome do arquivo (ex: 'LAADV_Cumprimento_JoaoSilva.pdf')
 * @param {string|null} b64 - conteúdo base64 do arquivo (null = só log de metadados)
 * @param {string} mime     - MIME type ('application/pdf', 'application/rtf', etc.)
 * @param {object} metadata - campos de auditoria (ver spec)
 */
async function registrarDocumento(tipo, nome, b64, mime, metadata) {
  const url = LAADV_BACKEND_URL || localStorage.getItem('laadv_backend_url') || '';
  if (!url) return; // backend não configurado — silencioso
  try {
    const resp = await fetch(url, {
      method : 'POST',
      body   : JSON.stringify({ tipo, nome, conteudo_base64: b64, mime, metadata }),
      headers: { 'Content-Type': 'text/plain' } // evita preflight CORS no Apps Script
    });
    const result = await resp.json();
    if (result.ok) {
      kernel.registrarBuild('BACKEND', `${result.id} — ${nome} → Drive`);
    } else {
      kernel.registrarBuild('BACKEND_ERR', result.erro || 'erro desconhecido');
    }
  } catch(e) {
    kernel.registrarBuild('BACKEND_ERR', e.message);
  }
}

/** Converte ArrayBuffer em string base64 */
function bufferParaBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let bin = '';
  bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin);
}
```

---

## Parte 2 — Campo de configuração da URL na aba Sistema (Kernel)

Na aba "📊 Sistema", localize a seção do build log (onde aparecem os logs do kernel).
**Antes** do build log, adicione este bloco de configuração:

```html
<div class="card" id="backend-config-card">
  <div class="card-title">🔗 Backend de Auditoria</div>
  <p style="font-size:12px;color:var(--txt-detalhe);margin-bottom:12px">
    Registra documentos gerados no Google Drive e Google Sheets.
    Cole a URL do Web App após implantar o Apps Script.
  </p>
  <div class="form-row cols-2">
    <div>
      <label>URL do Web App (Google Apps Script)</label>
      <input type="url" id="backend-url-input" placeholder="https://script.google.com/macros/s/..."
        style="font-size:12px"
        oninput="salvarBackendUrl(this.value)">
    </div>
    <div style="display:flex;align-items:flex-end;gap:8px">
      <button class="btn btn-outline" onclick="testarBackend()" style="margin-bottom:0">
        🔌 Testar Conexão
      </button>
      <span id="backend-status" style="font-size:11px;color:var(--txt-detalhe)"></span>
    </div>
  </div>
</div>
```

E logo após (ainda na aba Sistema ou na seção de scripts), adicione as funções:

```js
function salvarBackendUrl(url) {
  try { localStorage.setItem('laadv_backend_url', url.trim()); } catch(e) {}
}

async function testarBackend() {
  const url = document.getElementById('backend-url-input')?.value?.trim() || '';
  const status = document.getElementById('backend-status');
  if (!url) { if(status) status.textContent = '⚠ URL não preenchida'; return; }
  if(status) status.textContent = '⏳ Testando...';
  try {
    const resp = await fetch(url, { method:'GET' });
    const json = await resp.json();
    if (json.ok && status) {
      status.textContent = '✅ Conectado — ' + (json.servico || 'OK');
      status.style.color = 'var(--success)';
    }
  } catch(e) {
    if(status) { status.textContent = '❌ ' + e.message; status.style.color = 'var(--danger)'; }
  }
}
```

No IIFE de inicialização (onde o sistema carrega ao iniciar), adicione após os `registrarBuild`:
```js
// Restaura URL do backend se salva
const backendInput = document.getElementById('backend-url-input');
if (backendInput) {
  try { backendInput.value = localStorage.getItem('laadv_backend_url') || ''; } catch(e) {}
}
```

---

## Parte 3 — Hook em `exportarPeticaoPDF()`

Localize a função `exportarPeticaoPDF()` em `render/report-builder.js` — ela é chamada
a partir do HTML. Como você não pode tocar `render/`, adicione o hook **no HTML**,
no wrapper que chama a função.

Procure onde `exportarPeticaoPDF()` é chamada no HTML (provavelmente um `onclick`).
Substitua por uma função wrapper:

```js
async function exportarPeticaoComBackend() {
  // 1. Exporta normalmente (gera o download)
  const doc = exportarPeticaoPDF(); // retorna o objeto jsPDF ou null

  // 2. Envia para o backend em paralelo (não aguarda)
  try {
    const d = PetitionEngine.DECODE();
    if (!d) return;
    const arrBuf = doc ? doc.output('arraybuffer') : null;
    const b64    = arrBuf ? bufferParaBase64(arrBuf) : null;
    const escritorioId = document.getElementById('pet-escritorio')?.value || '';
    const esc = (typeof ESCRITORIOS !== 'undefined' && ESCRITORIOS[escritorioId])
                ? ESCRITORIOS[escritorioId].escritorio_nome : escritorioId;
    registrarDocumento('peticao_pdf',
      `LAADV_Peticao_${(d.clienteNome||'cliente').replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`,
      b64,
      'application/pdf',
      {
        escritorio : esc,
        tipo_peca  : d.tipoPeca || '',
        cliente    : d.clienteNome || '',
        cpf        : d.clienteCPF || '',
        processo   : d.processo || '',
        banco      : d.bancoReu || '',
        valor_causa: d.valorCausa || ''
      }
    );
  } catch(e) { /* fire-and-forget */ }
}
```

**Atenção:** `exportarPeticaoPDF()` atualmente retorna `void` (não retorna o doc).
Verifique em `render/report-builder.js` se é possível retornar o objeto jsPDF.
Se não for — e como você não pode tocar render/ — use `b64 = null` neste hook
(registra só os metadados, sem upload do arquivo ao Drive).
Isso ainda registra na planilha, que é o mais importante para auditoria.

---

## Parte 4 — Hook em `exportarPeticaoRTF()`

Localize onde `exportarPeticaoRTF()` é chamada. Adicione wrapper similar:

```js
function exportarPeticaoRTFComBackend() {
  exportarPeticaoRTF(); // executa normalmente
  try {
    const d = PetitionEngine.DECODE();
    if (!d) return;
    const escritorioId = document.getElementById('pet-escritorio')?.value || '';
    registrarDocumento('peticao_rtf',
      `LAADV_Peticao_${(d.clienteNome||'cliente').replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.rtf`,
      null, // RTF: só log de metadados
      'application/rtf',
      {
        escritorio : escritorioId,
        tipo_peca  : d.tipoPeca || '',
        cliente    : d.clienteNome || '',
        cpf        : d.clienteCPF || '',
        processo   : d.processo || '',
        banco      : d.bancoReu || '',
        valor_causa: d.valorCausa || ''
      }
    );
  } catch(e) { /* fire-and-forget */ }
}
```

---

## Parte 5 — Hook em `exportarPDF()` (Relatório)

Localize onde o botão de export do relatório chama `exportarPDF()`. Adicione:

```js
function exportarRelatorioComBackend() {
  exportarPDF(); // executa normalmente
  try {
    const proc    = document.getElementById('rel-processo')?.value || '';
    const cliente = document.getElementById('rel-cliente')?.value || '';
    registrarDocumento('relatorio',
      `LAADV_Relatorio_${(cliente||'calc').replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`,
      null, // só log
      'application/pdf',
      {
        cliente  : cliente,
        processo : proc,
        tipo_calculo : 'Relatório de Cálculo'
      }
    );
  } catch(e) { /* fire-and-forget */ }
}
```

---

## Parte 6 — Hook em `gerarFundamentoPDF(tipo)` (Memória de Cálculo)

Localize onde `gerarFundamentoPDF()` é chamada. Adicione:

```js
function gerarFundamentoComBackend(tipo) {
  gerarFundamentoPDF(tipo); // executa normalmente
  try {
    const cliente = document.getElementById(tipo === 'consig' ? 'tm-nome' : 'c-nome')?.value || '';
    registrarDocumento('memoria_calculo',
      `LAADV_Memoria_${tipo}_${new Date().toISOString().slice(0,10)}.pdf`,
      null,
      'application/pdf',
      {
        cliente : cliente,
        tipo    : tipo === 'consig' ? 'Memória Consignado' : 'Memória Cálculo Individual'
      }
    );
  } catch(e) { /* fire-and-forget */ }
}
```

---

## Parte 7 — Atualizar os `onclick` dos botões

Após criar os wrappers, substitua os `onclick` dos botões correspondentes:

| Botão atual | Substituir por |
|---|---|
| `onclick="exportarPeticaoPDF()"` | `onclick="exportarPeticaoComBackend()"` |
| `onclick="exportarPeticaoRTF()"` | `onclick="exportarPeticaoRTFComBackend()"` |
| `onclick="exportarPDF()"` (relatório) | `onclick="exportarRelatorioComBackend()"` |
| `onclick="gerarFundamentoPDF('consig')"` | `onclick="gerarFundamentoComBackend('consig')"` |
| `onclick="gerarFundamentoPDF('calc')"` | `onclick="gerarFundamentoComBackend('calc')"` |

> Pesquise cada `onclick` no HTML com cuidado — pode haver mais de uma ocorrência.
> Substitua todas.

---

## Critério de Aceite

- [ ] Constante `LAADV_BACKEND_URL` lida do localStorage ao carregar
- [ ] `registrarDocumento()` existe, é async, fire-and-forget (não bloqueia se falhar)
- [ ] Card "Backend de Auditoria" aparece na aba Sistema com campo URL e botão Testar
- [ ] URL é salva no localStorage ao digitar
- [ ] Botão "Testar Conexão" faz GET e exibe status (✅ / ❌)
- [ ] Todos os 5 botões de export usam os wrappers `*ComBackend()`
- [ ] Sem erros no console quando backend não configurado (URL vazia → retorno silencioso)
- [ ] Sem regressão nos exports — download continua funcionando normalmente

---

## Entrega

```
git add LAADV_Calculadora_Juridica_v1.html
git commit -m "feat(TASK-015): integração backend Google Apps Script — Drive + Sheets audit log"
git push origin claude/work-backend-015
```

---

*AKE/UFT-1.0 | BUILD: LAADV-20260526 | IC: 1.0 | MÓDULO: PROMPT_TASK_015*
