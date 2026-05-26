// AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MODULO: render/report-builder.js
'use strict';

//  ReportBuilder — Gerador de Memória de Cálculo
// ══════════════════════════════════════════════════════════════════════
const ReportBuilder = {
  _items:[],
  add(item){ this._items.push({...item,id:Date.now()}); },
  clear()  { this._items=[]; },
  count()  { return this._items.length; },

  buildHTML(proc,cli,db) {
    if(!this._items.length)return'<div class="empty-state">Nenhum cálculo adicionado ao relatório.</div>';
    const now=new Date().toLocaleDateString('pt-BR');
    const total=this._items.reduce((s,i)=>s+(i.wb?.acc??0),0);
    let html=`<h2>MEMÓRIA DE CÁLCULO — LAADV</h2>
    <div class="mc-fundamento">
      <strong>Processo:</strong> ${escHtml(proc||'—')} &nbsp;|&nbsp;
      <strong>Cliente:</strong> ${escHtml(cli||'—')} &nbsp;|&nbsp;
      <strong>Data Base:</strong> ${escHtml(db||now)} &nbsp;|&nbsp;
      <strong>Emissão:</strong> ${now}
    </div>
    <h3>1. Fundamento Legal</h3>
    <div class="mc-fundamento">
      <strong>Lei 14.905/2024</strong> — correção INPC + mora 1% a.m. (pré-30/08/2024) e IPCA + mora SELIC (pós-30/08/2024).<br>
      <strong>Art. 42, §único, CDC</strong> — repetição em dobro para cobranças indevidas de RMC/RCC.<br>
      <strong>Art. 406, CC</strong> — mora de 1% a.m. para períodos anteriores à Lei 14.905/24.<br>
      Índices: IBGE (IPCA, INPC), FGV (IGP-M), Banco Central do Brasil (SELIC).<br>
      <strong>TJDFT/TJRJ/TJAM</strong> — utilizam INPC como base de correção monetária.
    </div>
    <h3>2. Detalhamento das Cobranças</h3>`;

    this._items.forEach((item,i)=>{
      const wb=item.wb, res=wb?.result;
      if(!wb||!res)return;
      const base=item.valorBase||0;
      const corr=res.valorCorrigido!==undefined?res.valorCorrigido:(wb.acc-wb.mr);
      html+=`
      <h3>${i+1}. ${escHtml(item.tipo||wb.cat)} — ${escHtml(item.dataInicio||'?')} a ${escHtml(item.dataFim||'?')}</h3>
      <table class="mc-table">
        <tr><th>Valor Original</th><td>${FinancialEngine.fmt(base)}</td><th>Fator de Correção</th><td>${wb.cr.toFixed(6)}</td></tr>
        <tr><th>Valor Corrigido</th><td>${FinancialEngine.fmt(corr)}</td><th>Juros de Mora</th><td>${FinancialEngine.fmt(wb.mr)}</td></tr>
        <tr><th>Regime Jurídico</th><td>${escHtml(wb.law)}</td><th>Índice</th><td>${escHtml(wb.idx)}</td></tr>
        <tr><th>Subtotal</th><td colspan="3" style="font-weight:700">${FinancialEngine.fmt(res.dobro?wb.acc/2:wb.acc)}</td></tr>
      </table>`;
      if(res.periodos?.length){
        html+=`<table class="mc-table"><tr><th>Regime</th><th>De</th><th>Até</th><th>Índice</th><th>Fator</th><th>Mora</th></tr>`;
        for(const p of res.periodos)
          html+=`<tr><td>${escHtml(p.regime)}</td><td>${p.de}</td><td>${p.ate}</td><td>${escHtml(p.idx)}</td><td>${p.fator.toFixed(6)}</td><td>${FinancialEngine.fmt(p.mora)}</td></tr>`;
        html+='</table>';
      }
      if(res.dobro)
        html+=`<div class="mc-fundamento" style="border-color:var(--gold)">⚖ <strong>Repetição em Dobro — Art. 42 CDC:</strong> ${FinancialEngine.fmt(wb.acc/2)} × 2 = <strong>${FinancialEngine.fmt(wb.acc)}</strong></div>`;
    });

    html+=`<div class="mc-total">TOTAL GERAL ATUALIZADO: ${FinancialEngine.fmt(total)} | ${this._items.length} cobrança(s)</div>
    <div class="mc-fundamento" style="font-size:11px;margin-top:6px">LAADV Plataforma Axiomática v1.3 · AKE/UFT-1.0 · ${now}</div>`;
    return html;
  },

  buildXLSXData() {
    const rows=[['Tipo','Início','Fim','Valor Base','Correção','Mora','Subtotal','Dobro','Total','Regime','Índice']];
    for(const item of this._items){
      const wb=item.wb; if(!wb)continue;
      const res=wb.result;
      const base=item.valorBase||0;
      const corr=(res.valorCorrigido||wb.acc-wb.mr)-base;
      rows.push([item.tipo||wb.cat,item.dataInicio||'',item.dataFim||'',base,+corr.toFixed(2),+wb.mr.toFixed(2),+(base+corr+wb.mr).toFixed(2),res?.dobro?'SIM':'NÃO',+wb.acc.toFixed(2),wb.law||'',wb.idx||'']);
    }
    return rows;
  }
};


// ══════════════════════════════════════════════════════════════════════


function copiarFundamento(txtId,btnId){
  const txt=document.getElementById(txtId).textContent;
  if(!txt||txt==='—') return;
  navigator.clipboard.writeText(txt).then(()=>{
    const btn=document.getElementById(btnId);
    btn.textContent='✓ Copiado!';
    btn.classList.add('copiado');
    setTimeout(()=>{btn.textContent='📋 Copiar Texto';btn.classList.remove('copiado');},2500);
  }).catch(()=>{
    // Fallback para navegadores sem clipboard API
    const ta=document.createElement('textarea');
    ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    const btn=document.getElementById(btnId);
    btn.textContent='✓ Copiado!'; btn.classList.add('copiado');
    setTimeout(()=>{btn.textContent='📋 Copiar Texto';btn.classList.remove('copiado');},2500);
  });
}

/** Gera PDF do Sistema de Apuração com layout LAADV
 *  tipo = 'calculo' | 'consignado' */
function gerarFundamentoPDF(tipo){
  if(!window.jspdf||!window.jspdf.jsPDF){alert('jsPDF não carregado. Verifique sua conexão.');return;}
  const {jsPDF}=window.jspdf;
  const isConsig=(tipo==='consignado');
  const txtId=isConsig?'tm-fundamento-txt':'r-fundamento-txt';
  const texto=document.getElementById(txtId).textContent||'';
  if(!texto||texto==='—'){alert('Execute o cálculo primeiro para gerar o PDF.');return;}
  const titulo=isConsig
    ?'SISTEMA DE APURAÇÃO — CRÉDITO CONSIGNADO (TAXA MÉDIA BACEN)'
    :'SISTEMA DE APURAÇÃO — CÁLCULO JURÍDICO-FINANCEIRO';
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const pW=doc.internal.pageSize.getWidth();   // 210mm
  const pH=doc.internal.pageSize.getHeight();  // 297mm
  const mL=14, mR=14, mB=18;
  const contentW=pW-mL-mR;
  const hoje=new Date().toLocaleDateString('pt-BR');
  // ── Paleta ──
  const TEAL=[11,74,68], GOLD=[201,169,62], WHITE=[255,255,255], MUTED=[107,123,122], DARK=[26,43,42];
  // ── Função de header por página ──
  function drawHeader(isFirst){
    const hH=isFirst?40:14;
    doc.setFillColor(...TEAL);
    doc.rect(0,0,pW,hH,'F');
    // Faixa ouro
    doc.setFillColor(...GOLD);
    doc.rect(0,hH,pW,1.5,'F');
    if(isFirst){
      // Logotipo / título
      doc.setTextColor(...WHITE);
      doc.setFont('helvetica','bold');
      doc.setFontSize(13);
      doc.text('LAADV — Plataforma Axiomática de Cálculo Jurídico-Financeiro',mL,12);
      doc.setFont('helvetica','normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...GOLD);
      doc.text('AKE/UFT-1.0 · Sistema de Apuração Formal para Impugnação · v1.4.0',mL,20);
      doc.setTextColor(...WHITE);
      doc.setFontSize(8);
      doc.text(titulo,mL,28);
      // Data (direita)
      doc.setFont('helvetica','normal');
      doc.setFontSize(7.5);
      doc.text('Emitido em: '+hoje,pW-mR,12,{align:'right'});
      // Linha divisória ouro (interna)
      doc.setFillColor(...GOLD);
      doc.rect(mL,34,contentW,0.4,'F');
      doc.setTextColor(...WHITE);
      doc.setFontSize(7);
      doc.text('Documento gerado automaticamente pelo sistema LAADV — uso exclusivo para fins jurídicos.',mL,38);
    } else {
      doc.setTextColor(...WHITE);
      doc.setFont('helvetica','bold');
      doc.setFontSize(8);
      doc.text('LAADV — Sistema de Apuração (continuação)',mL,9);
      doc.setFont('helvetica','normal');
      doc.setFontSize(7);
      doc.setTextColor(...GOLD);
      doc.text(titulo,pW-mR,9,{align:'right'});
    }
  }
  // ── Função de footer ──
  function drawFooter(pageNum,totalPages){
    doc.setFillColor(...GOLD);
    doc.rect(0,pH-13,pW,0.5,'F');
    doc.setFillColor(245,247,249);
    doc.rect(0,pH-12.5,pW,12.5,'F');
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica','normal');
    doc.setFontSize(6.5);
    doc.text('LAADV · AKE/UFT-1.0 · v1.4.0 · Plataforma Axiomática de Cálculo Jurídico-Financeiro',mL,pH-6);
    doc.text(`Página ${pageNum} de ${totalPages} · Emitido em ${hoje}`,pW-mR,pH-6,{align:'right'});
  }
  // ── Renderizar texto ──
  drawHeader(true);
  doc.setFont('courier','normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...DARK);
  const lines=doc.splitTextToSize(texto,contentW);
  let y=48;   // y inicial (abaixo do header primeira página)
  const lineH=4.2;
  const yMax=pH-mB-6;  // limite inferior (acima do footer)
  let pageNum=1;
  for(let i=0;i<lines.length;i++){
    if(y+lineH>yMax){
      pageNum++;
      doc.addPage();
      drawHeader(false);
      doc.setFont('courier','normal');
      doc.setFontSize(7.8);
      doc.setTextColor(...DARK);
      y=22;
    }
    doc.text(lines[i],mL,y);
    y+=lineH;
  }
  // ── Rodapé em todas as páginas ──
  const totalPages=doc.internal.getNumberOfPages();
  for(let p=1;p<=totalPages;p++){
    doc.setPage(p);
    drawFooter(p,totalPages);
  }
  // ── Salvar ──
  const dateStr=new Date().toISOString().slice(0,10).replace(/-/g,'');
  const tipoLabel=isConsig?'CONSIGNADO':'JURIDICO';
  doc.save(`LAADV_Sistema_Apuracao_${tipoLabel}_${dateStr}.pdf`);
}

/** Mostra/oculta campo de taxa manual quando mora=MANUAL_TAXA
 *  prefix = 'c' (calcular) ou 'lote' */


function gerarRelatorio(){
  const proc=document.getElementById('rel-processo').value;
  const cli=document.getElementById('rel-cliente').value;
  const db=document.getElementById('rel-database').value;
  document.getElementById('memoria-wrap').innerHTML=ReportBuilder.buildHTML(proc,cli,db);
  kernel.registrarBuild('RELATORIO',`Memória gerada — ${ReportBuilder.count()} item(ns)`);
}

function limparRelatorio(){
  if(!confirm('Limpar todos os itens do relatório?'))return;
  ReportBuilder.clear();
  document.getElementById('memoria-wrap').innerHTML='<div class="empty-state">Relatório limpo.</div>';
}

function exportarPDF(){
  if(!window.jspdf?.jsPDF){alert('jsPDF não carregado. Verifique a conexão.');return;}
  gerarRelatorio();
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  doc.setFont('helvetica');
  doc.setFontSize(16);doc.setTextColor(11,74,68);
  doc.text('LAADV — Memória de Cálculo',20,20);
  doc.setFontSize(10);doc.setTextColor(100);
  doc.text(`Processo: ${document.getElementById('rel-processo').value||'—'}`,20,30);
  doc.text(`Cliente: ${document.getElementById('rel-cliente').value||'—'}`,20,36);
  doc.text(`Data Base: ${document.getElementById('rel-database').value||new Date().toLocaleDateString('pt-BR')}`,20,42);
  doc.setFontSize(8);doc.setTextColor(150);
  doc.text('AKE/UFT-1.0 · LAADV Plataforma Axiomática v1.2',20,48);
  const rows=ReportBuilder.buildXLSXData();
  if(rows.length>1){
    doc.autoTable({startY:56,head:[rows[0]],body:rows.slice(1),
      headStyles:{fillColor:[11,74,68],textColor:255,fontSize:7},
      bodyStyles:{fontSize:7},
      alternateRowStyles:{fillColor:[245,247,249]}
    });
  }
  const nome=`LAADV_Memoria_${(document.getElementById('rel-processo').value||'calc').replace(/\W/g,'_')}.pdf`;
  doc.save(nome);
  kernel.registrarBuild('EXPORT','PDF: '+nome);
}

function exportarXLSX(){
  const rows=ReportBuilder.buildXLSXData();
  if(rows.length<2){alert('Adicione ao menos um cálculo ao relatório.');return;}
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=[10,10,10,12,12,12,12,8,12,18,16].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb,ws,'Memória de Cálculo');
  // Aba de índices
  const ir=[['Mês','IPCA','INPC','IGP-M','SELIC']];
  for(const m of Object.keys(LIBRARY.INDICES.IPCA))
    ir.push([m,LIBRARY.INDICES.IPCA[m]??'',LIBRARY.INDICES.INPC[m]??'',LIBRARY.INDICES.IGPM[m]??'',LIBRARY.INDICES.SELIC[m]??'']);
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(ir),'Índices');
  const nome=`LAADV_${(document.getElementById('rel-processo').value||'calc').replace(/\W/g,'_')}_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb,nome);
  kernel.registrarBuild('EXPORT','XLSX: '+nome);
}

// ─── KERNEL ───


function escHtml(s){
  if(typeof s!=='string')return String(s??'');
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


// ══════════════════════════════════════════════════════════════════════
//  PETITION ENGINE — AKE/UFT-1.0 extension
// ══════════════════════════════════════════════════════════════════════

/** Converte valor numérico para extenso em PT-BR (reais e centavos) */


function exportarPeticaoPDF(){
  if(!window.jspdf?.jsPDF){alert('jsPDF não disponível.');return;}
  const d=PetitionEngine.DECODE();
  const missing=PetitionEngine.VALIDATE(d);
  if(missing.length){alert('Campos obrigatórios:\n• '+missing.join('\n• '));return;}
  const {jsPDF}=window.jspdf;
  const esc=ESCRITORIOS[d.escritorioId];
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const pW=210,pH=297;
  const mL=30,mR=20,mT=25,mB=20;
  const cW=pW-mL-mR; // 160mm
  const hoje=new Date().toLocaleDateString('pt-BR');
  const [PR,PG,PB]=esc.cor_primaria;
  const [AR,AG,AB]=esc.cor_acento;

  function drawHeader(first){
    if(first){
      // Linha topo colorida
      doc.setFillColor(PR,PG,PB);
      doc.rect(0,0,pW,8,'F');
      doc.setFillColor(AR,AG,AB);
      doc.rect(0,8,pW,2,'F');
      // Nome escritório no topo
      doc.setFont('helvetica','bold');
      doc.setFontSize(8);
      doc.setTextColor(255,255,255);
      doc.text(esc.adv_nome,mL,5.5);
      doc.setFont('helvetica','normal');
      doc.setFontSize(7);
      doc.text(`${esc.email}  |  ${esc.tel}`,pW-mR,5.5,{align:'right'});
    } else {
      doc.setFillColor(PR,PG,PB);
      doc.rect(0,0,pW,4,'F');
    }
  }

  function drawFooter(p,total){
    doc.setFillColor(AR,AG,AB);
    doc.rect(0,pH-10,pW,0.5,'F');
    doc.setTextColor(120,130,130);
    doc.setFont('helvetica','normal');
    doc.setFontSize(6.5);
    doc.text(`LAADV — Plataforma Axiomática de Cálculo Jurídico-Financeiro v1.4.0`,mL,pH-5);
    doc.text(`Página ${p} de ${total} · ${hoje}`,pW-mR,pH-5,{align:'right'});
  }

  // Texto completo
  const texto=PetitionEngine.RENDER_TEXT(d);
  const linhas=texto.split('\n');

  drawHeader(true);
  doc.setFont('times','normal');
  doc.setFontSize(12);
  doc.setTextColor(0,0,0);

  let y=mT+4;
  const lh=6.5; // line height
  const yMax=pH-mB-6;
  let pageN=1;

  for(const linha of linhas){
    // Quebra de linha automática
    const wrapped=doc.splitTextToSize(linha||' ',cW);
    for(const wl of wrapped){
      if(y+lh>yMax){
        drawFooter(pageN,1);
        doc.addPage();
        pageN++;
        drawHeader(false);
        doc.setFont('times','normal');
        doc.setFontSize(12);
        doc.setTextColor(0,0,0);
        y=mT+4;
      }
      // Detecção de formatação especial
      const isCentro=wl.trim().startsWith('I. ')||wl.trim().startsWith('II. ')||
                     wl.trim()==='AO JUIZ DE DIREITO'||wl.trim()==='AO JUÍZO DE DIREITO'||
                     wl.includes('CÁLCULOS DA COMPENSAÇÃO')||wl.includes('PLANILHA DE CÁLCULOS');
      const isSep=wl.startsWith('──');
      if(isSep){
        doc.setDrawColor(AR,AG,AB);
        doc.line(mL,y-1,mL+cW,y-1);
        y+=2;continue;
      }
      if(isCentro){
        doc.setFont('times','bold');
        doc.text(wl,pW/2,y,{align:'center'});
        doc.setFont('times','normal');
      } else {
        doc.text(wl,mL,y);
      }
      y+=lh;
    }
  }

  // Footer em todas as páginas
  const totalPages=doc.internal.getNumberOfPages();
  for(let p=1;p<=totalPages;p++){doc.setPage(p);drawFooter(p,totalPages);}

  const dateStr=new Date().toISOString().slice(0,10).replace(/-/g,'');
  const autorSlug=(d.autor.split(' ')[0]||'AUTOR').slice(0,12);
  doc.save(`LAADV_Cumprimento_${autorSlug}_${dateStr}.pdf`);
}

/** Exporta petição como RTF (compatível com Word) */


function exportarPeticaoRTF(){
  const d=PetitionEngine.DECODE();
  const missing=PetitionEngine.VALIDATE(d);
  if(missing.length){alert('Campos obrigatórios:\n• '+missing.join('\n• '));return;}
  const texto=PetitionEngine.RENDER_TEXT(d);

  function escRTF(s){
    return s.replace(/\\/g,'\\\\').replace(/\{/g,'\\{').replace(/\}/g,'\\}')
            .replace(/[^\x00-\x7E]/g,c=>{
              const code=c.charCodeAt(0);
              if(code<256)return `\\'${code.toString(16).padStart(2,'0')}`;
              return `\\u${code}?`;
            });
  }

  const linhas=texto.split('\n').map(l=>{
    const e=escRTF(l);
    const isSec=l.trim().startsWith('I. ')||l.trim().startsWith('II. ');
    const isTab=l.includes('CÁLCULOS DA COMPENSAÇÃO')||l.includes('PLANILHA DE CÁLCULOS');
    if(isSec||isTab)return `{\\pard\\qc\\b ${e}\\b0\\par}`;
    if(l.trim()==='')return `{\\pard\\par}`;
    return `{\\pard\\qj ${e}\\par}`;
  }).join('\n');

  const rtf=`{\\rtf1\\ansi\\ansicpg1252\\deff0\n{\\fonttbl{\\f0\\froman\\fcharset0 Times New Roman;}}\n{\\colortbl ;\\red0\\green0\\blue0;}\n\\widowctrl\\hyphauto\n\\margl1701\\margr1134\\margt1417\\margb1134\n\\f0\\fs24\\cf1\n${linhas}\n}`;

  const blob=new Blob([rtf],{type:'application/rtf'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const dateStr=new Date().toISOString().slice(0,10).replace(/-/g,'');
  const autorSlug=(d.autor.split(' ')[0]||'AUTOR').slice(0,12);
  a.href=url; a.download=`LAADV_Cumprimento_${autorSlug}_${dateStr}.rtf`;
  a.click(); URL.revokeObjectURL(url);
}

/** Limpa o formulário de petição */

// -- exports para outros modulos --
window.ReportBuilder = ReportBuilder;
window.copiarFundamento = copiarFundamento;
window.gerarFundamentoPDF = gerarFundamentoPDF;
window.gerarRelatorio = gerarRelatorio;
window.limparRelatorio = limparRelatorio;
window.exportarPDF = exportarPDF;
window.exportarXLSX = exportarXLSX;
window.escHtml = escHtml;
window.exportarPeticaoPDF = exportarPeticaoPDF;
window.exportarPeticaoRTF = exportarPeticaoRTF;
