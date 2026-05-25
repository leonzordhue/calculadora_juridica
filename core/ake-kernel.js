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
