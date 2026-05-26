// AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MODULO: core/legal-cpu.js
'use strict';

//  LegalCPU — Pipeline FETCH → DECODE → EXECUTE → WRITEBACK
//  Inspirado em MIPS R3000 · Harvard Architecture
// ══════════════════════════════════════════════════════════════════════
class LegalCPU {
  constructor() {
    this.R={ACC:0,CR:1,MR:0,LAW:null,IDX:null,CAT:null,PC:0,IC:1};
    this._trace=[]; this._halted=false; this._result=null;
    this._ini=null; this._fim=null; this._idxManual=null;
  }
  _emit(stage,msg){ this._trace.push({stage,pc:this.R.PC,msg}); }

  FETCH(valor,cat) {
    if (isNaN(valor)||valor<=0){ this._emit('error','FETCH: valor inválido='+valor);this.R.IC=0;this._halted=true;return this; }
    this.R.ACC=valor; this.R.CAT=cat; this.R.PC++;
    this._emit('fetch',`LOAD  ACC←${FinancialEngine.fmt(valor)}  CAT←${cat}`);
    return this;
  }

  DECODE(ini,fim,idxManual=null) {
    const sdt=new Date('2024-08-30T00:00:00');
    const idt=new Date(ini+'T00:00:00');
    const fdt=new Date(fim+'T00:00:00');
    if (idt>=fdt){ this._emit('error','DECODE: dataInicio>=dataFim → IC=0');this.R.IC=0;this._halted=true;return this; }
    this._ini=ini; this._fim=fim; this._idxManual=idxManual;
    if (idxManual&&idxManual!=='AUTO_14905') {
      this.R.LAW='MANUAL'; this.R.IDX=idxManual;
    } else if (fdt<=sdt) {
      this.R.LAW='PRÉ-14.905/24'; this.R.IDX='INPC';
    } else if (idt>=sdt) {
      this.R.LAW='PÓS-14.905/24'; this.R.IDX='IPCA+SELIC';
    } else {
      this.R.LAW='SPLIT-14.905/24'; this.R.IDX='INPC→IPCA+SELIC';
    }
    this.R.PC++;
    this._emit('decode',`LAW←${this.R.LAW}  IDX←${this.R.IDX}  PER←${ini}→${fim}`);
    return this;
  }

  /**
   * EXECUTE — calcula correção + mora.
   * @param {string} moraType  'AUTO_14905'|'1PCT'|'SELIC_MORA'|'NENHUM'|'MANUAL_TAXA'
   * @param {boolean} dobro    aplica repetição em dobro (Art. 42 CDC)
   * @param {object} opts      {moraIni: 'YYYY-MM-DD'|null, taxaManualPct: number|null}
   *   moraIni      — data de início dos juros de mora (ex: data da citação).
   *                  Se omitido, usa a data de início da correção.
   *   taxaManualPct — taxa mensal em % para moraType='MANUAL_TAXA'
   */
  EXECUTE(moraType='AUTO_14905', dobro=false, opts={}) {
    const { moraIni=null, taxaManualPct=null } = opts;
    if (this._halted){ this._emit('error','EXECUTE: CPU HALTED');return this; }
    const base=this.R.ACC;
    let res;

    // ── Correção monetária ───────────────────────────────────────────
    if (this.R.LAW==='MANUAL' && this._idxManual==='NENHUMA') {
      // Sem correção: fator = 1, apenas mora será calculada
      res={valorCorrigido:base,mora:0,fatorTotal:1,
           periodos:[{regime:'SEM CORREÇÃO',idx:'NENHUMA',de:this._ini,ate:this._fim,fator:1,mora:0}]};
      this._emit('execute','SEM CORREÇÃO — fator=1.000000');
    } else if (this.R.LAW==='MANUAL') {
      const f=FinancialEngine.acumularIndice(this._idxManual,this._ini,this._fim);
      res={valorCorrigido:base*f,mora:0,fatorTotal:f,
           periodos:[{regime:'MANUAL',idx:this._idxManual,de:this._ini,ate:this._fim,fator:f,mora:0}]};
    } else {
      res=FinancialEngine.calcLei14905(base,this._ini,this._fim);
    }

    // ── Juros de mora ────────────────────────────────────────────────
    // data de início da mora: campo específico ou, se vazio, data início da cobrança
    const mIni = (moraIni && moraIni>this._ini) ? moraIni : this._ini;
    const mFim = this._fim;
    const mBase = res.valorCorrigido; // mora incide sobre valor corrigido (STJ)

    if (moraType==='NENHUM') {
      res.mora=0;
    } else if (moraType==='MANUAL_TAXA') {
      const pct = (taxaManualPct!=null && !isNaN(taxaManualPct)) ? taxaManualPct : 1.0;
      res.mora = FinancialEngine.calcMoraSimples(mBase, mIni, mFim, pct);
      this._emit('execute',`MORA MANUAL ${pct}% a.m. · início=${mIni}`);
    } else if (moraType==='SELIC_MORA') {
      const fs=FinancialEngine.acumularIndice('SELIC',mIni,mFim);
      res.mora=mBase*(fs-1);
      if (mIni!==this._ini) this._emit('execute',`MORA SELIC início=${mIni}`);
    } else if (moraType==='1PCT') {
      res.mora=FinancialEngine.calcMoraSimples(mBase,mIni,mFim,1.0);
      if (mIni!==this._ini) this._emit('execute',`MORA 1% a.m. início=${mIni}`);
    } else {
      // AUTO_14905: respeita o que calcLei14905 calculou, mas recalcula se moraIni diferente
      if (mIni!==this._ini) {
        // Recalcula mora com novo início, mantendo tipo automático
        const fdt=new Date(mFim+'T00:00:00');
        const sdt=new Date('2024-08-30T00:00:00');
        if (fdt<=sdt) res.mora=FinancialEngine.calcMoraSimples(mBase,mIni,mFim,1.0);
        else { const fs=FinancialEngine.acumularIndice('SELIC',mIni,mFim); res.mora=mBase*(fs-1); }
        this._emit('execute',`MORA AUTO início-override=${mIni}`);
      }
    }

    this.R.CR=res.fatorTotal; this.R.MR=res.mora;
    this.R.ACC=res.valorCorrigido+res.mora;
    this._emit('execute',
      `BASE=${FinancialEngine.fmt(base)}  FATOR=${res.fatorTotal.toFixed(6)}  `+
      `CORR=${FinancialEngine.fmt(res.valorCorrigido-base)}  MORA=${FinancialEngine.fmt(res.mora)}`);
    if (dobro){
      const antes=this.R.ACC; this.R.ACC=FinancialEngine.calcDobro(antes);
      this._emit('execute',`DOBRO  CDC.Art42: ${FinancialEngine.fmt(antes)} × 2 = ${FinancialEngine.fmt(this.R.ACC)}`);
    }
    this.R.PC++;
    this._result={...res,dobro,totalFinal:this.R.ACC,moraIni:mIni};
    return this;
  }

  WRITEBACK() {
    if (this.R.IC<LIBRARY.JURIDICO.IC_MIN){
      this._emit('error',`WRITEBACK BLOQUEADO — IC=${this.R.IC.toFixed(2)}<${LIBRARY.JURIDICO.IC_MIN}`);
      return null;
    }
    this.R.PC++;
    this._emit('writeback',`OK  ACC=${FinancialEngine.fmt(this.R.ACC)}  CR=${this.R.CR.toFixed(6)}  IC=${this.R.IC.toFixed(2)}`);
    return {acc:this.R.ACC,cr:this.R.CR,mr:this.R.MR,law:this.R.LAW,idx:this.R.IDX,cat:this.R.CAT,ic:this.R.IC,result:this._result,trace:this._trace};
  }

  renderTrace() {
    return this._trace.map(t=>{
      const cls='s-'+t.stage;
      return `<span class="${cls}">[PC:${String(t.pc).padStart(3,'0')}][${t.stage.toUpperCase().padEnd(9)}] ${escHtml(t.msg)}</span>`;
    }).join('\n');
  }
}


// ══════════════════════════════════════════════════════════════════════


function abrirBACEN() {
  const tipo=document.getElementById('tm-tipo').value;
  const saque=document.getElementById('tm-saque').value;
  const ini=document.getElementById('tm-inicio').value;
  const cfg=LIBRARY.BACEN_SGS[tipo];
  const periodo=saque||ini||new Date().toISOString().slice(0,10);
  const url=`https://www.bcb.gov.br/estatisticas/reporttxjuroshistorico?codigoSegmento=1&codigoModalidade=${cfg.modalidade}&InicioPeriodo=${periodo}`;
  window.open(url,'_blank');
  kernel.registrarBuild('BACEN',`Abrir: ${cfg.label} a partir de ${periodo}`);
}

/** Busca taxa média via BACEN SGS API — usa data do saque quando disponível */
async function buscarTaxaMedia() {
  const tipo=document.getElementById('tm-tipo').value;
  const saque=document.getElementById('tm-saque').value;   // ★ data do saque (prioritária)
  const ini=document.getElementById('tm-inicio').value;    // legado (primeiro desconto)
  const fim=document.getElementById('tm-fim').value||new Date().toISOString().slice(0,10);
  const cfg=LIBRARY.BACEN_SGS[tipo];
  const infoEl=document.getElementById('tm-taxa-info');

  // ── Estratégia de busca ─────────────────────────────────────────────────
  // Prioridade 1: data do saque → busca APENAS aquele mês
  // Prioridade 2: período de descontos → média ao longo do período
  let iniSGS, fimSGS, modoLabel;
  if (saque) {
    // Mês completo do saque: do dia 01 ao último dia do mês
    const d=new Date(saque+'T00:00:00');
    const iniMes=new Date(d.getFullYear(),d.getMonth(),1);
    const fimMes=new Date(d.getFullYear(),d.getMonth()+1,0);
    iniSGS=`${String(iniMes.getDate()).padStart(2,'0')}/${String(iniMes.getMonth()+1).padStart(2,'0')}/${iniMes.getFullYear()}`;
    fimSGS=`${String(fimMes.getDate()).padStart(2,'0')}/${String(fimMes.getMonth()+1).padStart(2,'0')}/${fimMes.getFullYear()}`;
    modoLabel=`Taxa de ${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} (mês do saque)`;
  } else if (ini) {
    iniSGS=ini.split('-').reverse().join('/');
    fimSGS=fim.split('-').reverse().join('/');
    modoLabel=`Média do período ${iniSGS} → ${fimSGS}`;
  } else {
    alert('Informe a Data do Saque / Contratação (campo destacado com ★) ou ao menos a Data do Primeiro Desconto.');
    return;
  }

  if (!navigator.onLine) {
    infoEl.textContent='';
    alert('Sem conexão com a internet. A taxa média BACEN não pode ser consultada offline.');
    return;
  }
  infoEl.textContent='Consultando BACEN...';
  const url=`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${cfg.sgsCodigo}/dados?formato=json&dataInicial=${iniSGS}&dataFinal=${fimSGS}`;
  try {
    kernel.registrarBuild('BACEN',`SGS ${cfg.sgsCodigo} · ${iniSGS} → ${fimSGS}`);
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(),12000);
    let resp;
    try {
      resp=await fetch(url,{signal:ctrl.signal});
      clearTimeout(timer);
    } catch(err) {
      clearTimeout(timer);
      if(err.name==='AbortError') throw new Error('Timeout: API BACEN não respondeu em 12s. Tente novamente.');
      throw err;
    }
    if(!resp.ok) throw new Error('HTTP '+resp.status);
    const dados=await resp.json();
    if(!dados.length) throw new Error('Sem dados para o período informado — verifique a data do saque');
    const validos=dados.filter(d=>!isNaN(parseFloat(d.valor)));
    if(!validos.length) throw new Error('Nenhum dado válido retornado pela API BACEN.');
    const media=validos.reduce((s,d)=>s+parseFloat(d.valor),0)/validos.length;
    document.getElementById('tm-taxa-manual').value=media.toFixed(4);
    // Nota metodológica: explica diferença SGS vs relatório histórico pontual
    infoEl.innerHTML=`
      <span style="color:var(--success);font-weight:700">✓ ${modoLabel} · ${media.toFixed(4)}% a.m. · ${cfg.label}</span><br>
      <span style="font-size:10px;line-height:1.5;display:block;margin-top:4px;color:#4A5568">
        <strong>📌 Nota metodológica:</strong>
        A série SGS ${cfg.sgsCodigo} representa a <strong>média ponderada por volume</strong> das novas concessões do mês — fonte oficial do BACEN, mesma usada pela Calculadora do Cidadão.
        O relatório histórico pontual do site BACEN pode mostrar valor ligeiramente diferente (±0,03–0,10%) por agregar dados em períodos semanais distintos dentro do mês.
        <strong>Ambas as fontes são oficiais BACEN e igualmente válidas para fins judiciais.</strong>
        A diferença percentual é irrelevante juridicamente — o SGS é a referência mais defensável por ser publicado oficialmente.
      </span>`;
    // Calcula parcelas se tiver período
    if (ini && fim) {
      const n=monthsBetween(ini,fim);
      if(!document.getElementById('tm-parcelas').value) document.getElementById('tm-parcelas').value=n;
    }
    kernel.registrarBuild('BACEN',`${modoLabel}: ${media.toFixed(4)}% a.m.`);
  } catch(err) {
    infoEl.textContent='';
    alert('Não foi possível buscar do BACEN: '+err.message+'\n\nInsira a taxa manualmente ou use o botão "Abrir BACEN" para consultar o site.');
    kernel.registrarErroCalculo('BACEN',err.message);
  }
}

/** Fórmula Price (PMT) — mesma da Calculadora do Cidadão BACEN */


function calcularConsignado() {
  // Leitura dos campos
  const totalExtrato=parseFloat(document.getElementById('tm-total').value);          // total descontado do extrato
  const saqueEl=document.getElementById('tm-saque-valor');
  const valorSaqueRaw=saqueEl?parseFloat(saqueEl.value):NaN;
  // PV para PMT: usa valor do saque se preenchido; fallback = total do extrato
  const valorSaque=(!isNaN(valorSaqueRaw)&&valorSaqueRaw>0)?valorSaqueRaw:totalExtrato;
  const n=parseInt(document.getElementById('tm-parcelas').value);
  const taxaPct=parseFloat(document.getElementById('tm-taxa-manual').value);
  const ini=document.getElementById('tm-inicio').value;
  const fim=document.getElementById('tm-fim').value||new Date().toISOString().slice(0,10);
  const tipo=document.getElementById('tm-tipo').value;
  const saque=document.getElementById('tm-saque').value||'';
  if(!totalExtrato||!n||!taxaPct){alert('Preencha: Total Descontado do Extrato, nº de parcelas e taxa média.');return;}
  const i=taxaPct/100;
  // PMT calculado sobre o valor do saque (PV do contrato)
  const pmt=calcPMT(valorSaque,i,n);
  const totalCorreto=pmt*n;                           // o que o banco deveria ter cobrado
  const excesso=Math.max(0,totalExtrato-totalCorreto); // indébito = extrato − correto
  const dobro=excesso*2;
  // Preenche result-grid principal
  document.getElementById('tm-r-descontado').textContent=FinancialEngine.fmt(totalExtrato);
  document.getElementById('tm-r-correto').textContent=FinancialEngine.fmt(totalCorreto);
  document.getElementById('tm-r-excesso').textContent=FinancialEngine.fmt(excesso);
  document.getElementById('tm-r-pmt').textContent=FinancialEngine.fmt(pmt)+'/mês';
  document.getElementById('tm-r-taxa').textContent=taxaPct.toFixed(4)+'% a.m.';
  document.getElementById('tm-r-periodo').textContent=`${n} parcelas · ${ini} → ${fim}`;
  // Preenche breakdown de subtração
  const elPv=document.getElementById('tm-r-calc-pv');
  const elPmt2=document.getElementById('tm-r-calc-pmt2');
  const elCorr=document.getElementById('tm-r-calc-correto');
  const elExtr=document.getElementById('tm-r-calc-extrato');
  const elCorr2=document.getElementById('tm-r-calc-correto2');
  const elExc=document.getElementById('tm-r-calc-excesso');
  if(elPv) elPv.textContent=FinancialEngine.fmt(valorSaque);
  if(elPmt2) elPmt2.textContent=FinancialEngine.fmt(pmt);
  if(elCorr) elCorr.textContent=FinancialEngine.fmt(totalCorreto);
  if(elExtr) elExtr.textContent=FinancialEngine.fmt(totalExtrato);
  if(elCorr2) elCorr2.textContent=FinancialEngine.fmt(totalCorreto);
  if(elExc) elExc.textContent=FinancialEngine.fmt(excesso);
  // Dobro banner
  const dbanner=document.getElementById('tm-r-dobro-banner');
  if(excesso>0.01){
    document.getElementById('tm-r-dobro').textContent=FinancialEngine.fmt(dobro);
    dbanner.classList.remove('hidden');
  } else {
    dbanner.classList.add('hidden');
  }
  try{ kernel.assertIC('WRITEBACK:CONSIG'); }catch(e){ kernel.exibirBloqueioIC(e,'tm-resultado');return; }
  document.getElementById('tm-resultado').classList.remove('hidden');
  // Salva estado para relatório e fundamento
  UIState.lastConsignado={
    total:totalExtrato,     // total descontado do extrato
    valorSaque,             // PV do contrato/saque
    n,taxa:taxaPct,pmt,totalCorreto,excesso,dobro,ini,fim,tipo,saque
  };
  // Gera sistema de apuração
  document.getElementById('tm-fundamento-txt').textContent=gerarFundamentoConsignado();
  kernel.registrarSucesso(`CONSIG:PV=${FinancialEngine.fmt(valorSaque)},PMT=${FinancialEngine.fmt(pmt)},extrato=${FinancialEngine.fmt(totalExtrato)},excesso=${FinancialEngine.fmt(excesso)}`);
}

/** Envia dados do consignado para o relatório */
function pushConsignadoRelatorio() {
  if(!UIState.lastConsignado){alert('Execute o cálculo de consignado primeiro.');return;}
  const c=UIState.lastConsignado;
  const cfg=LIBRARY.BACEN_SGS[c.tipo];
  ReportBuilder.add({
    wb:{
      acc:c.dobro>0?c.dobro:c.excesso,
      cr:1.0,mr:0,
      law:'Conversão Consignado — Fórmula Price (BACEN)',
      idx:`SGS ${cfg.sgsCodigo} · ${cfg.label}`,
      cat:'TAXA_MEDIA',ic:1.0,
      result:{dobro:c.dobro>0,valorCorrigido:c.excesso,periodos:[
        {regime:'CONSIGNADO',idx:`${c.taxa.toFixed(4)}% a.m.`,de:c.ini,ate:c.fim,fator:1,mora:0}
      ]}
    },
    tipo:'Taxa Média Consignado ('+cfg.label+')',
    valorBase:c.total,
    dataInicio:c.ini,
    dataFim:c.fim
  });
  alert(`✓ Adicionado ao relatório! Total: ${ReportBuilder.count()} item(s).`);
  kernel.registrarBuild('RELATORIO',`Consignado: total=${FinancialEngine.fmt(c.total)}, excesso=${FinancialEngine.fmt(c.excesso)}`);
}

/** Preenche automaticamente o módulo Taxa Média a partir das transações RMC/RCC selecionadas */
function enviarParaTaxaMedia() {
  const body=document.getElementById('txn-body');
  const txns=body._txns||[];
  const sel=[];
  document.querySelectorAll('.txn-cb:checked').forEach(cb=>{
    const t=txns[parseInt(cb.dataset.idx)];
    if(t&&['RMC','RCC'].includes(t.categoria)&&t.tipo==='D') sel.push(t);
  });
  if(!sel.length){alert('Selecione ao menos uma transação RMC ou RCC (débito) para analisar.');return;}
  const totalVal=sel.reduce((s,t)=>s+t.valor,0);
  const datas=sel.map(t=>t.data).sort();
  const primeiraData=datas[0];
  const ultimaData=datas[datas.length-1];
  const nMeses=monthsBetween(primeiraData,ultimaData)||1;
  document.getElementById('tm-total').value=totalVal.toFixed(2);
  document.getElementById('tm-inicio').value=primeiraData;  // campo hidden legado
  document.getElementById('tm-fim').value=ultimaData;
  document.getElementById('tm-parcelas').value=nMeses;
  // Não preenche tm-saque automaticamente — usuário deve informar a data do saque/contratação
  switchTab('calcular',document.querySelectorAll('.tab-btn')[1]);
  setTimeout(()=>document.getElementById('card-taxamedia').scrollIntoView({behavior:'smooth'}),200);
  kernel.registrarBuild('TAXA_MEDIA',`${sel.length} transações · ${FinancialEngine.fmt(totalVal)} · ${primeiraData} → ${ultimaData}`);
}

/** Atualiza totalizador RMC+RCC selecionados na aba Extratos — exibe por categoria */


function enviarParaLote(){
  const body=document.getElementById('txn-body');
  const txns=body._txns||[];
  const sel=[];
  document.querySelectorAll('.txn-cb:checked').forEach(cb=>{
    const t=txns[parseInt(cb.dataset.idx)];
    if(t&&t.tipo==='D') sel.push(t);
  });
  if(!sel.length){alert('Selecione ao menos uma transação (débito) para calcular em lote.');return;}
  UIState.batchTransacoes=sel;
  UIState.lastBatchResults=[];

  // Preenche data base com hoje por padrão
  const hoje=new Date().toISOString().split('T')[0];
  switchTab('calcular',document.querySelectorAll('.tab-btn')[1]);
  setTimeout(()=>{
    document.getElementById('card-lote').scrollIntoView({behavior:'smooth'});
    if(!document.getElementById('lote-datafim').value)
      document.getElementById('lote-datafim').value=hoje;
    // Atualiza badge
    const badge=document.getElementById('lote-badge');
    badge.classList.remove('hidden');
    document.getElementById('lote-count').textContent=sel.length;
    const tipos={};
    sel.forEach(t=>tipos[t.categoria]=(tipos[t.categoria]||0)+1);
    document.getElementById('lote-tipos').textContent=
      Object.entries(tipos).map(([c,n])=>`${n}× ${c}`).join('  |  ');
    const totalOrig=sel.reduce((s,t)=>s+t.valor,0);
    document.getElementById('lote-total-orig-badge').textContent=
      'Total original: '+FinancialEngine.fmt(totalOrig);
    // Oculta resultado anterior
    document.getElementById('lote-resultado').classList.add('hidden');
  },200);
  kernel.registrarBuild('LOTE_IMPORT',`${sel.length} transações carregadas para cálculo em lote`);
}

/** Mapeamento de categoria para classe CSS de tag */
function _tagClass(cat){
  return {RMC:'tag-rmc',RCC:'tag-rmc',BX_FINAN:'tag-bx',TARIFA:'tag-tarifa',
          SEGURO:'tag-seguro',JUROS:'tag-juros',PARCELA:'tag-parcela',OUTROS:'tag-outros'}[cat]||'tag-outros';
}

/** Executa cálculo individual em cada parcela do lote e exibe tabela discriminada */
function calcularLote(){
  const batch=UIState.batchTransacoes;
  if(!batch||!batch.length){
    alert('Nenhuma parcela carregada. Use "📊 Calcular em Lote" na aba Extratos primeiro.');return;
  }
  const datafim=document.getElementById('lote-datafim').value;
  if(!datafim){alert('Informe a Data Base de Atualização.');return;}
  const indiceVal=document.getElementById('lote-indice').value;
  const moraVal=document.getElementById('lote-mora').value;
  const loteMoraTaxaPct=moraVal==='MANUAL_TAXA'?parseFloat(document.getElementById('lote-mora-taxa-pct').value)||null:null;
  if(moraVal==='MANUAL_TAXA'&&!loteMoraTaxaPct){alert('Informe a taxa de mora manual (% a.m.) para o lote.');return;}
  const dobroAuto=document.getElementById('lote-dobro').checked;

  const tbody=document.getElementById('lote-tbody');
  tbody.innerHTML='';

  let totalOriginal=0,totalFinal=0,totalAcrescimos=0,contOK=0;
  const batchResults=[];

  for(const t of batch){
    // Validação de datas: início deve ser anterior à data base
    if(t.data>=datafim){
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${t.data}</td>
        <td><span class="tag ${_tagClass(t.categoria)}">${t.categoria}</span></td>
        <td class="text-right">${FinancialEngine.fmt(t.valor)}</td>
        <td colspan="6" style="color:var(--warn);font-size:11px">⚠ Data da parcela igual ou posterior à data base — sem acréscimos</td>`;
      tbody.appendChild(tr);
      // Mesmo sem correção, o valor original entra no total
      totalOriginal+=t.valor;
      totalFinal+=t.valor;
      batchResults.push({t,wb:null,corrAmount:0,subtotalSimples:t.valor,totalItem:t.valor,dobro:false,semCorrecao:true});
      continue;
    }
    try{
      const dobro=dobroAuto&&['RMC','RCC'].includes(t.categoria);
      const cpu=new LegalCPU();
      const wb=cpu.FETCH(t.valor,t.categoria)
                  .DECODE(t.data,datafim,indiceVal==='AUTO_14905'?null:indiceVal)
                  .EXECUTE(moraVal,dobro,{taxaManualPct:loteMoraTaxaPct})
                  .WRITEBACK();
      if(!wb){
        const tr=document.createElement('tr');
        tr.innerHTML=`<td>${t.data}</td>
          <td><span class="tag ${_tagClass(t.categoria)}">${t.categoria}</span></td>
          <td class="text-right">${FinancialEngine.fmt(t.valor)}</td>
          <td colspan="6" style="color:var(--danger);font-size:11px">✗ WRITEBACK bloqueado (IC &lt; 0.9)</td>`;
        tbody.appendChild(tr);
        continue;
      }
      const res=wb.result;
      const corrAmount=res.valorCorrigido-t.valor;
      const subtotalSimples=res.valorCorrigido+wb.mr;
      const totalItem=wb.acc;   // já inclui dobro se aplicado

      totalOriginal+=t.valor;
      totalFinal+=totalItem;
      totalAcrescimos+=(subtotalSimples-t.valor);
      contOK++;

      const tr=document.createElement('tr');
      tr.innerHTML=`
        <td style="white-space:nowrap">${t.data}</td>
        <td><span class="tag ${_tagClass(t.categoria)}">${t.categoria}</span></td>
        <td class="text-right">${FinancialEngine.fmt(t.valor)}</td>
        <td class="text-right" style="font-size:11px;color:var(--muted)">${wb.cr.toFixed(6)}</td>
        <td class="text-right">${FinancialEngine.fmt(corrAmount)}</td>
        <td class="text-right">${FinancialEngine.fmt(wb.mr)}</td>
        <td class="text-right">${FinancialEngine.fmt(subtotalSimples)}</td>
        <td style="text-align:center">${dobro?'<span style="color:var(--danger);font-weight:700;font-size:13px">✓ ×2</span>':'<span style="color:var(--muted)">—</span>'}</td>
        <td class="text-right" style="font-weight:700;color:var(--teal);font-size:13px">${FinancialEngine.fmt(totalItem)}</td>`;
      tbody.appendChild(tr);

      batchResults.push({t,wb,corrAmount,subtotalSimples,totalItem,dobro,semCorrecao:false});
    }catch(e){
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${t.data}</td>
        <td><span class="tag ${_tagClass(t.categoria)}">${t.categoria}</span></td>
        <td class="text-right">${FinancialEngine.fmt(t.valor)}</td>
        <td colspan="6" style="color:var(--danger);font-size:11px">✗ Erro: ${escHtml(e.message)}</td>`;
      tbody.appendChild(tr);
    }
  }

  // Linha de total geral
  const trTot=document.createElement('tr');
  trTot.style.cssText='background:rgba(11,74,68,.08);font-weight:700;border-top:2px solid var(--teal)';
  trTot.innerHTML=`
    <td colspan="2" style="font-weight:700;color:var(--teal)">TOTAL GERAL — ${contOK} de ${batch.length} parcelas calculadas</td>
    <td class="text-right" style="font-weight:700">${FinancialEngine.fmt(totalOriginal)}</td>
    <td></td>
    <td></td>
    <td></td>
    <td class="text-right" style="font-weight:700">${FinancialEngine.fmt(totalAcrescimos+totalOriginal)}</td>
    <td></td>
    <td class="text-right" style="font-weight:700;color:var(--teal);font-size:14px">${FinancialEngine.fmt(totalFinal)}</td>`;
  tbody.appendChild(trTot);

  // Totais no banner
  document.getElementById('lote-g-original').textContent=FinancialEngine.fmt(totalOriginal);
  document.getElementById('lote-g-acrescimos').textContent=FinancialEngine.fmt(totalAcrescimos);
  document.getElementById('lote-g-total').textContent=FinancialEngine.fmt(totalFinal);
  document.getElementById('lote-g-qtd').textContent=`${batch.length}`;

  UIState.lastBatchResults=batchResults;
  document.getElementById('lote-resultado').classList.remove('hidden');
  kernel.registrarSucesso(`LOTE:${batch.length} parcelas · Original=${FinancialEngine.fmt(totalOriginal)} · Total=${FinancialEngine.fmt(totalFinal)}`);
}

/** Adiciona todos os itens do lote ao Relatório */
function pushLoteRelatorio(){
  if(!UIState.lastBatchResults||!UIState.lastBatchResults.length){
    alert('Execute o cálculo em lote primeiro (▶ Calcular Todas as Parcelas).');return;
  }
  const datafim=document.getElementById('lote-datafim').value;
  let adicionados=0;
  UIState.lastBatchResults.forEach(r=>{
    if(!r.wb) return; // pula itens sem cálculo (data inválida / erro)
    ReportBuilder.add({
      wb:r.wb,
      tipo:r.t.categoria,
      valorBase:r.t.valor,
      dataInicio:r.t.data,
      dataFim:datafim
    });
    adicionados++;
  });
  alert(`✓ ${adicionados} parcela(s) adicionadas ao relatório! Total acumulado: ${ReportBuilder.count()} item(s).`);
  kernel.registrarBuild('RELATORIO',`Lote: ${adicionados} parcelas adicionadas`);
}

// ─── CALCULAR ───


function executarCalculo(){
  const tipo=document.getElementById('c-tipo').value;
  const ini=document.getElementById('c-inicio').value;
  const fim=document.getElementById('c-fim').value;
  const valor=parseFloat(document.getElementById('c-valor').value);
  const indice=document.getElementById('c-indice').value;
  const mora=document.getElementById('c-mora').value;
  const moraIni=document.getElementById('c-mora-inicio').value||null;
  const taxaManualPct=mora==='MANUAL_TAXA'?parseFloat(document.getElementById('c-mora-taxa-pct').value)||null:null;
  const dobro=document.getElementById('c-dobro').checked&&['RMC','RCC'].includes(tipo);
  if(!ini||!fim||!valor){alert('Preencha: valor, data início e data fim.');return;}
  if(mora==='MANUAL_TAXA'&&!taxaManualPct){alert('Informe a taxa de mora manual (% a.m.).');return;}
  try {
    const cpu=new LegalCPU();
    const wb=cpu.FETCH(valor,tipo).DECODE(ini,fim,indice==='AUTO_14905'?null:indice).EXECUTE(mora,dobro,{moraIni,taxaManualPct}).WRITEBACK();
    if(!wb){alert('WRITEBACK bloqueado — IC < 0.9. Verifique os dados inseridos.');return;}
    UIState.lastWB=wb; UIState.lastValorBase=valor;
    UIState.lastDataInicio=ini; UIState.lastDataFim=fim; UIState.lastTipo=tipo;
    UIState.lastIndice=indice; UIState.lastMoraTipo=mora;
    UIState.lastMoraIni=moraIni||''; UIState.lastMoraTaxaPct=taxaManualPct;
    const res=wb.result;
    // Valores SIMPLES (sempre pré-dobro): valorCorrigido = principal × fator acumulado
    const corrAmount=res.valorCorrigido-valor;       // só a correção monetária (sem mora)
    const subtotalSimples=res.valorCorrigido+wb.mr;  // subtotal antes do dobro
    document.getElementById('r-original').textContent=FinancialEngine.fmt(valor);
    document.getElementById('r-correcao').textContent=FinancialEngine.fmt(corrAmount);
    document.getElementById('r-mora').textContent=FinancialEngine.fmt(wb.mr);
    document.getElementById('r-fator').textContent=wb.cr.toFixed(6);
    document.getElementById('r-regime').textContent=wb.law;
    // Subtotal mostra sempre o valor simples; dobro aparece no banner abaixo
    document.getElementById('r-subtotal').textContent=FinancialEngine.fmt(subtotalSimples);
    document.getElementById('r-subtotal-label').textContent=res.dobro?'SUBTOTAL SIMPLES':'SUBTOTAL';
    const db=document.getElementById('dobro-banner');
    if(res.dobro){
      // Mostra a fórmula: subtotal × 2 = total final — transparência total
      document.getElementById('r-dobro').textContent=
        `${FinancialEngine.fmt(subtotalSimples)} × 2 = ${FinancialEngine.fmt(wb.acc)}`;
      db.classList.remove('hidden');
    } else db.classList.add('hidden');
    document.getElementById('pipeline-out').innerHTML=cpu.renderTrace();
    try{ kernel.assertIC('WRITEBACK:CALC'); }catch(e){ kernel.exibirBloqueioIC(e,'calc-res');return; }
    document.getElementById('calc-res').classList.remove('hidden');
    const traceDetails=document.getElementById('trace-details');
    if(traceDetails){ traceDetails.open=false; }
    // Popula comparativo automaticamente
    document.getElementById('laadv-principal').value=valor.toFixed(2);
    document.getElementById('laadv-correcao').value=corrAmount.toFixed(2);
    document.getElementById('laadv-mora').value=wb.mr.toFixed(2);
    document.getElementById('laadv-total').value=subtotalSimples.toFixed(2);
    document.getElementById('laadv-fundamento').value=wb.law+' · '+wb.idx;
    // Gera sistema de apuração para impugnação
    document.getElementById('r-fundamento-txt').textContent=gerarFundamentoCalculo();
    kernel.registrarSucesso(`CALC:${tipo}:${valor.toFixed(2)}→${FinancialEngine.fmt(wb.acc)}`);
  } catch(err){
    kernel.registrarErroCalculo('CALC',tipo+':'+err.message);
    alert('Erro no cálculo: '+err.message);
  }
}

// ─── SISTEMA DE APURAÇÃO — para Impugnação ───



const _IDX_LABEL={
  'INPC':'INPC — Índice Nacional de Preços ao Consumidor (IBGE)',
  'IPCA':'IPCA — Índice Nacional de Preços ao Consumidor Amplo (IBGE)',
  'IGPM':'IGP-M — Índice Geral de Preços do Mercado (FGV)',
  'SELIC':'SELIC — Taxa do Sistema Especial de Liquidação e Custódia (BACEN)',
  'IPCA_E':'IPCA-E — Índice Nacional de Preços ao Consumidor Amplo Especial (IBGE/SGS 10764)',
  'TJRJ':'INPC (TJRJ — adotado pelo Tribunal de Justiça do Estado do Rio de Janeiro)',
  'TJAM':'INPC (TJAM — adotado pelo Tribunal de Justiça do Estado do Amazonas)',
  'TJDFT':'INPC (TJDFT — adotado pelo Tribunal de Justiça do Distrito Federal e Territórios)',
  'NENHUMA':'Sem correção monetária — apenas mora (conforme determinação do juízo)',
  'INPC→IPCA+SELIC':'INPC (pré-14.905/24) + IPCA/SELIC (pós-14.905/24)'
};
const _MORA_LABEL={
  'AUTO_14905':'Calculada nos termos da Lei nº 14.905/2024:\n    • Período anterior a 30/08/2024: 1% a.m. simples (art. 406 CC)\n    • Período posterior a 30/08/2024: Taxa SELIC (art. 406 CC com redação da Lei 14.905/24)',
  '1PCT':'1% ao mês simples — art. 406 do Código Civil c/c art. 161, §1º, CTN',
  'SELIC_MORA':'Taxa SELIC — art. 406 do Código Civil (redação dada pela Lei nº 14.905/2024)',
  'NENHUM':'Sem juros de mora (conforme determinação do juízo)',
  'MANUAL_TAXA':'Taxa manual informada pelo operador jurídico'
};
const _TIPO_LABEL={
  'RMC':'Reserva de Margem Consignável — Cartão (RMC)',
  'RCC':'Reserva de Cartão Consignado (RCC)',
  'BX_FINAN':'Refinanciamento / Baixa de Financiamento',
  'TARIFA':'Tarifa Bancária Indevida',
  'SEGURO':'Seguro Forçado (Prestamista / Vida)',
  'JUROS':'Juros / Mora / IOF Abusivos',
  'PARCELA':'Parcela de Empréstimo Indevida',
  'OUTROS':'Outros'
};

/** Gera texto formal do sistema de apuração para o cálculo principal */
function gerarFundamentoCalculo(){
  const wb=UIState.lastWB; if(!wb) return '—';
  const res=wb.result;
  const v=UIState.lastValorBase;
  const tipo=UIState.lastTipo;
  const ini=UIState.lastDataInicio;
  const fim=UIState.lastDataFim;
  const corrAmount=res.valorCorrigido-v;
  const subtotal=res.valorCorrigido+wb.mr;
  const hoje=new Date().toLocaleDateString('pt-BR');
  const idxLabel=_IDX_LABEL[wb.idx]||wb.idx;
  const moraLabel=_MORA_LABEL[UIState.lastMoraTipo]||UIState.lastMoraTipo;
  const moraIniLine=UIState.lastMoraIni?`\n    Início da mora: ${UIState.lastMoraIni} (data fixada)`:'';
  const taxaManualLine=UIState.lastMoraTipo==='MANUAL_TAXA'&&UIState.lastMoraTaxaPct?`\n    Taxa aplicada: ${UIState.lastMoraTaxaPct}% a.m.`:'';
  let periodosText='';
  if(res.periodos?.length>1){
    periodosText='\n    Detalhamento por regime:\n'+res.periodos.map(p=>
      `      • ${p.regime}: ${p.de} a ${p.ate} | Índice: ${p.idx} | Fator: ${p.fator.toFixed(6)}`
    ).join('\n');
  }
  let dobroText='';
  if(res.dobro){
    dobroText=`\n\n═══════════════════════════════════════════════
 REPETIÇÃO EM DOBRO — ART. 42, §ÚNICO, CDC
═══════════════════════════════════════════════
 Subtotal antes do dobro : ${FinancialEngine.fmt(subtotal)}
 Fator                   : × 2
 TOTAL COM DOBRO         : ${FinancialEngine.fmt(wb.acc)}

 Base legal: Art. 42, parágrafo único, da Lei nº 8.078/1990 (Código de
 Defesa do Consumidor) — o consumidor cobrado em quantia indevida tem
 direito à repetição do indébito por valor igual ao dobro do que pagou
 em excesso, acrescido de correção monetária e juros legais.`;
  }
  return `╔══════════════════════════════════════════════════════════════╗
║       SISTEMA DE APURAÇÃO — LAADV v1.3 · AKE/UFT-1.0        ║
║              Data do cálculo: ${hoje.padEnd(12)}                   ║
╚══════════════════════════════════════════════════════════════╝

 IDENTIFICAÇÃO
 ─────────────────────────────────────────────────────────────
 Tipo de cobrança : ${_TIPO_LABEL[tipo]||tipo}
 Valor original   : ${FinancialEngine.fmt(v)}
 Período          : ${ini} a ${fim} (Termo Final)
 Regime jurídico  : ${wb.law}

 CORREÇÃO MONETÁRIA
 ─────────────────────────────────────────────────────────────
 Índice aplicado  : ${idxLabel}
 Fator acumulado  : ${wb.cr.toFixed(6)}
 Valor corrigido  : ${FinancialEngine.fmt(res.valorCorrigido)} (acréscimo: ${FinancialEngine.fmt(corrAmount)})${periodosText}
 Fonte dos dados  : IBGE / BACEN — Sistema Gerenciador de Séries Temporais (SGS)

 JUROS DE MORA
 ─────────────────────────────────────────────────────────────
 ${moraLabel}${moraIniLine}${taxaManualLine}
 Valor dos juros  : ${FinancialEngine.fmt(wb.mr)}

 RESULTADO APURADO
 ─────────────────────────────────────────────────────────────
 (+) Principal             : ${FinancialEngine.fmt(v)}
 (+) Correção monetária    : ${FinancialEngine.fmt(corrAmount)}
 (+) Juros de mora         : ${FinancialEngine.fmt(wb.mr)}
 (=) SUBTOTAL${res.dobro?' (pré-dobro)':'           '} : ${FinancialEngine.fmt(subtotal)}${dobroText}

 BASE LEGAL
 ─────────────────────────────────────────────────────────────
 • Correção monetária: ${idxLabel}
 • Juros de mora: ${UIState.lastMoraTipo==='AUTO_14905'||UIState.lastMoraTipo===''?'Lei nº 14.905/2024; art. 406 do Código Civil':moraLabel.split('\n')[0]}
 • Cobrança indevida de RMC/RCC: vedação à vinculação de crédito/débito
   automático sem autorização expressa — art. 39, III e VI, CDC;
   Resolução BACEN nº 3.694/2009; Resolução BACEN nº 4.676/2018
 • Plataforma: LAADV — Sistema Axiomático de Cálculo Jurídico-Financeiro v1.4.0`;
}

/** Gera texto formal do sistema de apuração para conversão consignado */
function gerarFundamentoConsignado(){
  const c=UIState.lastConsignado; if(!c) return '—';
  const cfg=LIBRARY.BACEN_SGS[c.tipo];
  const hoje=new Date().toLocaleDateString('pt-BR');
  const saqueLabel=c.saque
    ?`Mês de ${new Date(c.saque+'T00:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'})} (data do saque/contratação)`
    :'Período informado';
  const iMensal=(c.taxa/100);
  const pvFmt=FinancialEngine.fmt(c.valorSaque);
  const pmtFormula=`PV × i / (1−(1+i)^−n) = ${pvFmt} × ${iMensal.toFixed(6)} / (1−(1+${iMensal.toFixed(6)})^−${c.n})`;
  return `╔══════════════════════════════════════════════════════════════╗
║   SISTEMA DE APURAÇÃO — CRÉDITO CONSIGNADO (TAXA MÉDIA BACEN) ║
║              Data do cálculo: ${hoje.padEnd(12)}                   ║
╚══════════════════════════════════════════════════════════════╝

 FONTE DA TAXA DE REFERÊNCIA
 ─────────────────────────────────────────────────────────────
 Série SGS        : nº ${cfg.sgsCodigo} — Banco Central do Brasil (BACEN)
 Denominação      : "${cfg.label}"
 Referência       : ${saqueLabel}
 Taxa apurada     : ${c.taxa.toFixed(4)}% ao mês

 METODOLOGIA DA TAXA
 ─────────────────────────────────────────────────────────────
 A série SGS ${cfg.sgsCodigo} representa a MÉDIA PONDERADA POR VOLUME das
 novas concessões de crédito pessoal consignado realizadas no mês de
 referência, publicada oficialmente pelo Banco Central do Brasil.
 Esta é a mesma série e metodologia utilizadas pela Calculadora do
 Cidadão do BACEN (disponível em bcb.gov.br/calculadora).

 Nota: pequenas diferenças (±0,03–0,10%) em relação ao relatório
 histórico pontual do site BACEN são normais e esperadas, decorrem
 da agregação por período semanal vs. mensal, e não afetam a
 validade jurídica do cálculo.

 CÁLCULO PELA FÓRMULA PRICE (PMT)
 ─────────────────────────────────────────────────────────────
 Valor do Saque / Contrato (PV) : ${pvFmt}
 Taxa média BACEN SGS           : ${c.taxa.toFixed(4)}% a.m.
 Número de parcelas (n)         : ${c.n} meses
 Fórmula: ${pmtFormula}
 Prestação justa (PMT/mês)      : ${FinancialEngine.fmt(c.pmt)}
 Total correto (PMT × n)        : ${FinancialEngine.fmt(c.totalCorreto)}

 APURAÇÃO DO INDÉBITO
 ─────────────────────────────────────────────────────────────
 Total descontado do extrato    : ${FinancialEngine.fmt(c.total)}
 (−) Total correto (PMT × n)    : ${FinancialEngine.fmt(c.totalCorreto)}
 ─────────────────────────────────────────────────────────────
 (=) EXCESSO COBRADO            : ${FinancialEngine.fmt(c.excesso)}
 Repetição em dobro (art. 42)  : ${FinancialEngine.fmt(c.dobro)}

 BASE LEGAL
 ─────────────────────────────────────────────────────────────
 • Taxa de mercado: SGS/BACEN ${cfg.sgsCodigo} — fonte oficial do Banco Central
 • Fórmula Price (PMT): mesma da Calculadora do Cidadão BACEN (bcb.gov.br)
 • Repetição em dobro: art. 42, parágrafo único, CDC (Lei nº 8.078/1990)
 • Cobrança indevida RMC/RCC: art. 39, III e VI, CDC; Res. BACEN 3.694/2009
 • Plataforma: LAADV — Sistema Axiomático de Cálculo Jurídico-Financeiro v1.4.0`;
}

/** Copia o texto de fundamento para a área de transferência */


function toggleMoraTaxa(prefix){
  const mora=document.getElementById(prefix+'-mora').value;
  const wrap=document.getElementById(prefix+'-mora-taxa-wrap');
  if(wrap) mora==='MANUAL_TAXA'?wrap.classList.remove('hidden'):wrap.classList.add('hidden');
}

function limparCalculo(){
  ['c-inicio','c-fim','c-valor','c-mora-inicio','c-mora-taxa-pct'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('c-tipo').selectedIndex=0;
  document.getElementById('c-indice').selectedIndex=0;
  document.getElementById('c-mora').selectedIndex=0;
  document.getElementById('c-dobro').checked=false;
  document.getElementById('calc-res').classList.add('hidden');
  document.getElementById('c-mora-taxa-wrap').classList.add('hidden');
  UIState.lastWB=null;
}

function pushToComparativo(){ switchTab('comparativo',document.querySelectorAll('.tab-btn')[2]); }

function pushToRelatorio(){
  if(!UIState.lastWB){alert('Execute um cálculo primeiro.');return;}
  ReportBuilder.add({wb:UIState.lastWB,tipo:UIState.lastTipo,valorBase:UIState.lastValorBase,dataInicio:UIState.lastDataInicio,dataFim:UIState.lastDataFim});
  alert(`✓ Adicionado! Total no relatório: ${ReportBuilder.count()} cálculo(s).`);
  kernel.registrarBuild('RELATORIO','Item adicionado: '+UIState.lastTipo);
}

// ─── COMPARATIVO ───
function calcComparativo(){
  const advP=parseFloat(document.getElementById('adv-principal').value)||0;
  const advC=parseFloat(document.getElementById('adv-correcao').value)||0;
  const advM=parseFloat(document.getElementById('adv-mora').value)||0;
  const advT=parseFloat(document.getElementById('adv-total').value)||advP+advC+advM;
  const laP=parseFloat(document.getElementById('laadv-principal').value)||0;
  const laC=parseFloat(document.getElementById('laadv-correcao').value)||0;
  const laM=parseFloat(document.getElementById('laadv-mora').value)||0;
  const laT=parseFloat(document.getElementById('laadv-total').value)||laP+laC+laM;
  document.getElementById('ar-principal').textContent=FinancialEngine.fmt(advP);
  document.getElementById('ar-correcao').textContent=FinancialEngine.fmt(advC);
  document.getElementById('ar-mora').textContent=FinancialEngine.fmt(advM);
  document.getElementById('ar-total').textContent=FinancialEngine.fmt(advT);
  document.getElementById('lr-principal').textContent=FinancialEngine.fmt(laP);
  document.getElementById('lr-correcao').textContent=FinancialEngine.fmt(laC);
  document.getElementById('lr-mora').textContent=FinancialEngine.fmt(laM);
  document.getElementById('lr-total').textContent=FinancialEngine.fmt(laT);
  const diff=advT-laT, pct=laT>0?diff/laT*100:0;
  const banner=document.getElementById('excess-banner');
  if(diff>0.01){
    banner.style.background='var(--gold)';banner.style.color='var(--teal)';
    banner.innerHTML=`⚠ EXCESSO IDENTIFICADO: ${FinancialEngine.fmt(diff)} (${pct.toFixed(2)}% acima do correto)<br><small>Fundamento: Art. 42 CDC — devolução em dobro do cobrado a mais</small>`;
  } else if(diff<-0.01){
    banner.style.background='var(--success)';banner.style.color='#fff';
    banner.innerHTML=`✓ LAADV apura valor ${FinancialEngine.fmt(Math.abs(diff))} favorável ao cliente`;
  } else {
    banner.style.background='#E8F5E9';banner.style.color='var(--success)';
    banner.innerHTML=`✓ Valores convergentes — diferença inferior a R$ 0,01`;
  }
  document.getElementById('cmp-resultado').classList.remove('hidden');
  UIState.comparativos.push({advT,laT,diff,pct,ts:new Date().toLocaleString('pt-BR')});
  renderHistorico();
  kernel.registrarBuild('COMP',`Adv=${FinancialEngine.fmt(advT)} LAADV=${FinancialEngine.fmt(laT)} Δ=${FinancialEngine.fmt(diff)}`);
}

function renderHistorico(){
  const c=document.getElementById('cmp-hist-body');
  if(!UIState.comparativos.length){c.innerHTML='<div class="empty-state">Nenhum comparativo realizado ainda.</div>';return;}
  c.innerHTML=`<table class="data-table"><thead><tr><th>#</th><th>Data/Hora</th><th>Adversário</th><th>LAADV</th><th>Excesso</th><th>%</th></tr></thead><tbody>
  ${UIState.comparativos.map((x,i)=>`<tr>
    <td>${i+1}</td><td>${x.ts}</td>
    <td class="vd">${FinancialEngine.fmt(x.advT)}</td>
    <td class="vc">${FinancialEngine.fmt(x.laT)}</td>
    <td class="${x.diff>0?'vd':'vc'}">${FinancialEngine.fmt(x.diff)}</td>
    <td>${x.pct.toFixed(2)}%</td>
  </tr>`).join('')}
  </tbody></table>`;
}

// ─── RELATÓRIO ───

// -- exports para outros modulos --
window.LegalCPU = LegalCPU;
window.abrirBACEN = abrirBACEN;
window.buscarTaxaMedia = buscarTaxaMedia;
window.calcularConsignado = calcularConsignado;
window.pushConsignadoRelatorio = pushConsignadoRelatorio;
window.enviarParaTaxaMedia = enviarParaTaxaMedia;
window.enviarParaLote = enviarParaLote;
window.calcularLote = calcularLote;
window.pushLoteRelatorio = pushLoteRelatorio;
window.executarCalculo = executarCalculo;
window.gerarFundamentoCalculo = gerarFundamentoCalculo;
window.gerarFundamentoConsignado = gerarFundamentoConsignado;
window.toggleMoraTaxa = toggleMoraTaxa;
window.limparCalculo = limparCalculo;
window.pushToComparativo = pushToComparativo;
window.pushToRelatorio = pushToRelatorio;
window.calcComparativo = calcComparativo;
window.renderHistorico = renderHistorico;
