// AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MODULO: core/ake-kernel.js
'use strict';

//  AKEKernel — Núcleo Termodinâmico · Q(n) = IC×[Ac/At]×e^(−H)×[1−B/At]
// ══════════════════════════════════════════════════════════════════════
class AKEKernel {
  constructor() {
    this._n=0; this._success=0; this._total=0; this._bugs=0;
    this._ax_c=1; this._ax_t=1; this._log=[]; this._probs=[];
  }
  calcEntropy() {
    if (!this._probs.length) return 0;
    const tot = this._probs.reduce((a,b)=>a+b,0);
    if (!tot) return 0;
    return -this._probs.reduce((h,p)=>{
      const pp=p/tot; return h+(pp>0?pp*Math.log2(pp):0);
    },0);
  }
  calcIC()          { return this._total>0?this._success/this._total:1.0; }
  calcTemperature() { return LIBRARY.JURIDICO.TAU_0*Math.exp(-LIBRARY.JURIDICO.LAMBDA*this._n); }
  calcQ() {
    const ic=this.calcIC(), ac=this._ax_c/this._ax_t,
          h=this.calcEntropy(), b=this._bugs/this._ax_t;
    return ic*ac*Math.exp(-h)*(1-b);
  }
  registrarSucesso(id){ this._success++;this._total++;this._ax_c++;this._ax_t++;this._probs.push(1);this._n++;this.registrarBuild('SUCCESS',id); }
  registrarFalha(id)  { this._total++;this._bugs++;this._ax_t++;this._probs.push(0);this._n++;this.registrarBuild('FAILURE',id); }
  registrarBuild(evento,detalhe){ this._log.push({ts:new Date().toISOString(),evento,detalhe});renderBuildLog();updateKernelMetrics(); }
  getLogs(){ return[...this._log]; }
  assertIC(contexto=''){
    const ic=this.calcIC();
    if(ic<LIBRARY.JURIDICO.IC_MIN){
      const msg=`WRITEBACK BLOQUEADO — IC: ${ic.toFixed(2)} < ${LIBRARY.JURIDICO.IC_MIN} [${contexto}]`;
      this.registrarBuild('IC_BLOCK',msg);
      throw new Error(msg);
    }
    return ic;
  }
  registrarErroCalculo(id,motivo){
    this._total++;this._bugs++;this._ax_t++;this._probs.push(0);this._n++;
    this.registrarBuild('CALC_ERROR',`[${id}] ${motivo}`);
  }
  exibirBloqueioIC(erro,elementoId){
    const el=document.getElementById(elementoId);
    if(!el)return;
    const ic=this.calcIC();
    el.innerHTML=`<div style="background:#C0392B;color:#fff;border-radius:10px;padding:20px 24px;margin-top:16px"><div style="font-size:16px;font-weight:700;margin-bottom:8px">⛔ WRITEBACK BLOQUEADO — IC: ${ic.toFixed(2)} (mínimo: ${LIBRARY.JURIDICO.IC_MIN})</div><div style="font-size:12px;opacity:.9">${erro.message}</div><div style="font-size:11px;opacity:.7;margin-top:6px">Corrija os erros acima e recalcule para liberar o resultado.</div></div>`;
    el.classList.remove('hidden');
  }
}


// ══════════════════════════════════════════════════════════════════════


//  UIState
// ══════════════════════════════════════════════════════════════════════
const UIState={lastWB:null,lastValorBase:0,lastDataInicio:'',lastDataFim:'',lastTipo:'',lastIndice:'',lastMoraTipo:'',lastMoraIni:'',lastMoraTaxaPct:null,comparativos:[],selAll:false,lastConsignado:null,batchTransacoes:[],lastBatchResults:[]};


// ══════════════════════════════════════════════════════════════════════


const kernel=new AKEKernel();

// -- exports para outros modulos --
window.AKEKernel = AKEKernel;
window.UIState = UIState;
window.kernel = kernel;
