// AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MODULO: core/financial-alu.js
'use strict';

//  FinancialEngine — ALU Layer · Funções puras · Object.freeze
// ══════════════════════════════════════════════════════════════════════
const FinancialEngine = Object.freeze({

  /** Acumula índice entre dataInicio (inclusive) e dataFim com pró-rata */
  acumularIndice(nome, dataInicio, dataFim) {
    // Fallback: TJRJ e TJAM usam INPC como base
    // TJRJ, TJAM e TJDFT utilizam INPC como base de correção monetária
    const nomeReal = (nome==='TJRJ'||nome==='TJAM'||nome==='TJDFT') ? 'INPC' : nome;
    const tbl = LIBRARY.INDICES[nomeReal];
    if (!tbl) return 1.0;
    const ini = new Date(dataInicio+'T00:00:00');
    const fim = new Date(dataFim+'T00:00:00');
    if (ini>=fim) return 1.0;
    let fator=1.0, y=ini.getFullYear(), m=ini.getMonth();
    while (y<fim.getFullYear()||(y===fim.getFullYear()&&m<=fim.getMonth())) {
      const chave=`${y}-${String(m+1).padStart(2,'0')}`;
      const taxa=tbl[chave];
      if (taxa!==undefined) {
        const dm=new Date(y,m+1,0).getDate();
        let dIni=1,dFim=dm;
        if (y===ini.getFullYear()&&m===ini.getMonth()) dIni=ini.getDate();
        if (y===fim.getFullYear()&&m===fim.getMonth()) dFim=fim.getDate()-1;
        if (dFim>=dIni) {
          const dias=dFim-dIni+1;
          fator *= dias>=dm ? (1+taxa/100) : (1+(taxa/100)*(dias/dm));
        }
      }
      m++; if(m===12){m=0;y++;}
    }
    return fator;
  },

  /** Juros de mora simples (Art. 406 CC) — default 1% a.m. */
  calcMoraSimples(base, dataInicio, dataFim, taxa=1.0) {
    const dias = (new Date(dataFim+'T00:00:00')-new Date(dataInicio+'T00:00:00'))/86400000;
    return base*(taxa/100)*(dias/30.0);
  },

  /** Lei 14.905/24 — split automático em 30/08/2024 */
  calcLei14905(valor, dataInicio, dataFim) {
    const SPLIT='2024-08-30';
    const sdt=new Date(SPLIT+'T00:00:00');
    const idt=new Date(dataInicio+'T00:00:00');
    const fdt=new Date(dataFim+'T00:00:00');
    let periodos=[];

    if (fdt<=sdt) {                          // inteiro pré
      const f=this.acumularIndice('INPC',dataInicio,dataFim);
      const m=this.calcMoraSimples(valor,dataInicio,dataFim,1.0);
      periodos.push({regime:'PRÉ-14.905/24',idx:'INPC',de:dataInicio,ate:dataFim,fator:f,mora:m});
      return {valorCorrigido:valor*f,mora:m,fatorTotal:f,periodos};
    }
    if (idt>=sdt) {                          // inteiro pós
      const fI=this.acumularIndice('IPCA',dataInicio,dataFim);
      const fS=this.acumularIndice('SELIC',dataInicio,dataFim);
      const m=valor*(fS-1);
      periodos.push({regime:'PÓS-14.905/24',idx:'IPCA+SELIC',de:dataInicio,ate:dataFim,fator:fI,mora:m});
      return {valorCorrigido:valor*fI,mora:m,fatorTotal:fI,periodos};
    }
    // Split period
    const f1=this.acumularIndice('INPC',dataInicio,SPLIT);
    const m1=this.calcMoraSimples(valor,dataInicio,SPLIT,1.0);
    const vS=valor*f1;
    periodos.push({regime:'PRÉ-14.905/24',idx:'INPC',de:dataInicio,ate:SPLIT,fator:f1,mora:m1});
    const fI=this.acumularIndice('IPCA',SPLIT,dataFim);
    const fS=this.acumularIndice('SELIC',SPLIT,dataFim);
    const m2=vS*(fS-1);
    periodos.push({regime:'PÓS-14.905/24',idx:'IPCA+SELIC',de:SPLIT,ate:dataFim,fator:fI,mora:m2});
    return {valorCorrigido:valor*f1*fI,mora:m1+m2,fatorTotal:f1*fI,periodos};
  },

  calcDobro(v){ return v*2; },
  fmt(v){ return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v); },
  fmtPct(v){ return ((v-1)*100).toFixed(4)+'%'; }
});


// ══════════════════════════════════════════════════════════════════════


function monthsBetween(d1, d2) {
  const a=new Date(d1+'T00:00:00'), b=new Date(d2+'T00:00:00');
  return Math.max(1,(b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth()));
}

/** Abre o relatório BACEN Histórico de Taxas de Juros para a modalidade selecionada */


function calcPMT(pv, iMensal, n) {
  if(iMensal===0) return pv/n;
  return pv*iMensal/( 1-Math.pow(1+iMensal,-n) );
}

/** Calcula conversão consignado e exibe resultado comparativo */

// -- exports para outros modulos --
window.FinancialEngine = FinancialEngine;
window.monthsBetween = monthsBetween;
window.calcPMT = calcPMT;
