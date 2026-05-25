// AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MODULO: core/petition-engine.js
'use strict';

function numExtenso(valor){
  const u=['','um','dois','três','quatro','cinco','seis','sete','oito','nove',
           'dez','onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove'];
  const d=['','','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa'];
  const cc=['','cento','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos'];
  function cent(n){
    if(n===0)return '';
    if(n===100)return 'cem';
    let r=cc[Math.floor(n/100)]||'';
    const rest=n%100;
    if(rest>0){
      if(r)r+=' e ';
      if(rest<20)r+=u[rest];
      else{ r+=d[Math.floor(rest/10)]; if(rest%10)r+=' e '+u[rest%10]; }
    }
    return r;
  }
  function integer(n){
    if(n===0)return 'zero';
    if(n>=1000000){
      const m=Math.floor(n/1000000),rest=n%1000000;
      let r=cent(m)+(m===1?' milhão':' milhões');
      if(rest>0)r+=(rest<100?' e ':' ')+integer(rest);
      return r;
    }
    if(n>=1000){
      const th=Math.floor(n/1000),rest=n%1000;
      let r=th===1?'mil':cent(th)+' mil';
      if(rest>0)r+=(rest<100?' e ':' ')+cent(rest);
      return r;
    }
    return cent(n);
  }
  const tot=Math.round(valor*100);
  const rei=Math.floor(tot/100),cts=tot%100;
  let r=integer(rei)+(rei===1?' real':' reais');
  if(cts>0)r+=' e '+cent(cts)+(cts===1?' centavo':' centavos');
  return r;
}

/** Formata data como "DD de mês de AAAA" */
function dataExtenso(dateStr){
  if(!dateStr)return '';
  const meses=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const d=new Date(dateStr+'T00:00:00');
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

/** Perfis dos escritórios */


const PetitionEngine={
  /** Coleta e valida todos os campos do formulário */
  DECODE(){
    const g=id=>document.getElementById(id)?.value?.trim()||'';
    const gn=id=>parseFloat(document.getElementById(id)?.value)||0;
    const escritorioId=document.querySelector('input[name="pet-escritorio"]:checked')?.value||'LAADV';
    const esc=ESCRITORIOS[escritorioId];
    const valorSaque=gn('pet-valor-saque');
    const valorComp=gn('pet-valor-compensado');
    const totalDesc=gn('pet-total-descontos');
    const danosMat=gn('pet-danos-mat');
    const moraisSimples=gn('pet-danos-morais-simples');
    const moraisAtu=gn('pet-danos-morais-atu')||moraisSimples;
    const honPct=gn('pet-honorarios-pct')||10;
    const matSimples=Math.max(0,totalDesc-valorComp);
    const honorarios=Math.round(((danosMat+moraisAtu)*honPct/100)*100)/100;
    const totalExec=danosMat+moraisAtu+honorarios;
    const genero=g('pet-genero')||'F';
    const F=genero==='F';
    return {
      processo:g('pet-processo'),
      vara:g('pet-vara'),
      comarca:g('pet-comarca').toUpperCase(),
      uf:g('pet-uf').toUpperCase(),
      juizo_prefix:g('pet-juizo'),
      tipo_decisao:g('pet-tipo-decisao')==='acordao'?'sentença e acórdão':'sentença',
      data_apuracao:g('pet-data-apuracao'),
      autor:g('pet-autor').toUpperCase(),
      genero,
      pronome_a:F?'a':'o',
      autor_a:F?'Autora':'Autor',
      da_a:F?'da':'do',
      pela_pelo:F?'pela':'pelo',
      desta_deste:F?'desta':'deste',
      tem_prescricao:document.getElementById('pet-prescricao')?.checked||false,
      ano_inicio_real:g('pet-ano-inicio-real'),
      data_ini_descontos:g('pet-data-ini-descontos'),
      data_fim_comp:g('pet-data-fim-comp'),
      mes_indevido:g('pet-mes-indevido').toUpperCase(),
      data_ini_indevido:g('pet-data-ini-indevido'),
      valorSaque, valorComp, totalDesc, matSimples, danosMat,
      moraisSimples, moraisAtu, honPct, honorarios, totalExec,
      adv_nome:g('pet-adv-nome')||esc.adv_nome,
      adv_oab:g('pet-adv-oab')||esc.adv_oab,
      adv_oab_assina:g('pet-adv-oab-assina')||esc.adv_oab_assina,
      escritorio_nome:g('pet-escritorio-nome')||esc.escritorio_nome,
      banco_nome:g('pet-banco-nome')||esc.banco_nome,
      banco_ag:g('pet-banco-ag')||esc.banco_ag,
      banco_cc:g('pet-banco-cc')||esc.banco_cc,
      banco_cnpj:g('pet-banco-cnpj')||esc.banco_cnpj,
      cidade:g('pet-cidade')||esc.cidade,
      data_assina:g('pet-data-assina'),
      escritorioId
    };
  },

  /** Valida campos obrigatórios */
  VALIDATE(d){
    const required=[
      [d.processo,'Número do Processo'],
      [d.vara,'Vara'],
      [d.comarca,'Comarca'],
      [d.uf,'UF'],
      [d.autor,'Nome do Autor'],
      [d.data_apuracao,'Data de Apuração'],
      [d.totalDesc,'Total Descontos'],
      [d.valorComp,'Valor a Compensar'],
      [d.danosMat,'Danos Materiais Atualizados']
    ];
    const missing=required.filter(([v])=>!v||v===0).map(([,l])=>l);
    return missing;
  },

  /** Gera HTML da petição para preview */
  RENDER_HTML(d){
    const fmt=FinancialEngine.fmt.bind(FinancialEngine);
    const ext=numExtenso;
    const fmtExt=(v)=>`R$ ${fmt(v)} (${ext(v)})`;

    // Bloco prescrição
    let blocoPresc='';
    if(d.tem_prescricao){
      blocoPresc=`<p class="pet-p-dest">Registre-se que, a parte Requerida descontou d${d.pronome_a} ${d.autor_a} parcelas desde ${d.ano_inicio_real}, porém, em razão da prescrição quinquenal, para fins de cálculos, apenas fora utilizado o período de ${d.data_ini_descontos} até ${d.data_fim_comp}. Logo, as parcelas de ${d.data_ini_descontos} até ${d.data_fim_comp}, foram utilizadas para compensar a parte Requerida do valor de ${fmtExt(d.valorComp)}, razão pela qual, não fazem parte dos cálculos desta execução.</p>`;
    } else {
      blocoPresc=`<p class="pet-p-dest">Importante é informar que, em razão da necessidade de compensação de valores em favor da Executada na quantia de ${fmtExt(d.valorComp)}, as parcelas de ${d.data_ini_descontos} a ${d.data_fim_comp}, foram revestidas em favor da executada visando a compensação dos valores, razão pela qual, não integram o cálculo de DANO MATERIAL.</p>`;
    }

    const dAssina=d.data_assina?dataExtenso(d.data_assina):dataExtenso(new Date().toISOString().slice(0,10));

    return `
<p class="pet-destino">AO ${d.juizo_prefix} DA ${d.vara} DA COMARCA DE ${d.comarca}/${d.uf}.</p>
<p class="pet-processo">Processo nº: ${d.processo}</p>
<p class="pet-intro"><strong>${d.autor}</strong>, já qualificad${d.pronome_a}(a) nos autos, vem, respeitosamente, perante Vossa Excelência, por intermédio do seu advogado abaixo-assinado, iniciar a fase de <strong>CUMPRIMENTO DE SENTENÇA</strong>, nos seguintes termos:</p>

<p class="pet-secao">I. DO CUMPRIMENTO DE SENTENÇA</p>

<p class="pet-p">Conforme ${d.tipo_decisao}, a parte Requerida fora condenada a devolver em dobro os valores que cobrou indevidamente da parte ${d.autor_a}, ou seja, os valores descontados do benefício d${d.pronome_a} ${d.autor_a} após a quitação do empréstimo ${d.desta_deste}.</p>
<p class="pet-p">Houve ainda condenação do Requerido em danos morais, no valor de ${fmtExt(d.moraisSimples)}. No que diz respeito aos honorários, houve concessão destes em ${d.honPct}% sobre o valor da condenação.</p>
<p class="pet-p">Por fim, fora determinado a compensação dos valores recebidos pel${d.pronome_a} ${d.autor_a} do Requerido, ou seja, a devolução dos valores recebidos a título de empréstimo ao Banco.</p>
<p class="pet-p">Assim, havendo retorno dos autos da segunda instância cível, conforme as partes foram instadas a requerer o prosseguimento da execução/cumprimento de sentença.</p>
<p class="pet-p" style="text-align:center">É o relatório necessário.</p>

<p class="pet-secao">II. DA APURAÇÃO DOS CÁLCULOS</p>

<p class="pet-p">Inicialmente, informa-se que os cálculos aqui apresentados, encontram-se apurados até a data de <strong>${d.data_apuracao?new Date(d.data_apuracao+'T00:00:00').toLocaleDateString('pt-BR'):''}</strong>.</p>
<p class="pet-p">Pois bem. Para fins de base na conversão do RMC, para consignado (utilizamos a taxa média do Bacen daquele ano), e dividimos tal valor em 24x.</p>
<p class="pet-p">Logo, o valor sacado pel${d.pronome_a} parte ${d.autor_a} via RMC (somando TODOS os saques constantes aos autos) é de <strong>${fmtExt(d.valorSaque)}</strong>. Porém, após converter o referido valor para a modalidade de empréstimo consignado, temos a quantia de <strong>${fmtExt(d.valorComp)}</strong>, a título de consignado, sendo este o valor a ser compensado pel${d.pronome_a} parte ${d.autor_a} ao Banco.</p>

${blocoPresc}

<p class="pet-p">Assim apurou-se que, as parcelas a partir de ${d.mes_indevido} foram descontadas d${d.pronome_a} ${d.autor_a} INDEVIDAMENTE, razão pela qual, as parcelas a partir de ${d.data_ini_indevido}, foram calculadas, corrigidas e cobradas na modalidade de repetição de indébito (conforme determinado em ${d.tipo_decisao}), perfazendo a quantia de <strong>${fmtExt(d.danosMat)}</strong>, a título de danos materiais, conforme planilha e cálculos anexos.</p>

<div class="pet-tabwrap">
<p style="font-weight:700;text-align:center;margin-bottom:10px">CÁLCULOS DA COMPENSAÇÃO</p>
<table class="pet-table">
  <tr><td>VALOR TOTAL DOS DESCONTOS (SIMPLES)</td><td>R$ ${fmt(d.totalDesc)}</td></tr>
  <tr><td>VALOR A SER COMPENSADO</td><td>R$ ${fmt(d.valorComp)}</td></tr>
  <tr><td>RESULTADO DA COMPENSAÇÃO</td><td>R$ ${fmt(d.totalDesc)} − R$ ${fmt(d.valorComp)} =<br><strong>R$ ${fmt(d.matSimples)}</strong></td></tr>
</table>
</div>

<div class="pet-tabwrap">
<p style="font-weight:700;text-align:center;margin-bottom:10px">PLANILHA DE CÁLCULOS DA EXECUÇÃO</p>
<table class="pet-table">
  <tr><td>DANOS MATERIAIS (SIMPLES)</td><td>${fmtExt(d.matSimples)}</td></tr>
  <tr><td>DANOS MATERIAIS CONFORME ${d.tipo_decisao.toUpperCase()}</td><td>${fmtExt(d.danosMat)}</td></tr>
  <tr><td>DANOS MORAIS (SIMPLES)</td><td>${fmtExt(d.moraisSimples)}</td></tr>
  <tr><td>DANOS MORAIS (ATUALIZADOS)</td><td>${fmtExt(d.moraisAtu)}</td></tr>
  <tr><td>HONORÁRIOS ADVOCATÍCIOS — ${d.honPct}%</td><td>${fmtExt(d.honorarios)}</td></tr>
  <tr style="background:#fffde7"><td><strong>VALOR TOTAL DA CONDENAÇÃO A SER EXECUTADO</strong></td><td><strong>${fmtExt(d.totalExec)}</strong></td></tr>
</table>
</div>

<p class="pet-p">Assim sendo, pugna-se, pela intimação do Requerido para apresentar e COMPROVAR o pagamento voluntário da condenação no prazo legal de 15 dias úteis, no valor de <strong>${fmtExt(d.totalExec)}</strong>, conforme a lei em vigor.</p>
<p class="pet-p">Caso não ocorra o pagamento voluntário, pugna-se, automaticamente, desde já, pelo cumprimento forçado da obrigação, com acréscimo das penalidades previstas em lei, especialmente as constantes no Art. 523, § 1º e 3º, do CPC.</p>
<p class="pet-p">Outrossim, por ocasião do pagamento voluntário ou o bloqueio do referido valor em ação forçada, requer, desde já, a expedição do alvará judicial eletrônico em nome do patrono d${d.pronome_a} ${d.autor_a}, <strong>${d.adv_nome}</strong>, ${d.adv_oab}, diretamente para a seguinte conta do escritório <strong>${d.escritorio_nome}</strong>:</p>

<div class="pet-banco">
  Banco: <strong>${d.banco_nome}</strong><br>
  Agência: <strong>${d.banco_ag}</strong><br>
  Conta Corrente: <strong>${d.banco_cc}</strong><br>
  CNPJ: <strong>${d.banco_cnpj}</strong>
</div>

<p class="pet-secao">I. CONCLUSÃO</p>
<p class="pet-p">Ante o exposto, requer-se:</p>
<div class="pet-pedidos">
  <p>1. A intimação do Requerido para, no prazo de 15 (quinze) dias, caso queira efetuar o pagamento voluntário da condenação;</p>
  <p>2. Havendo o pagamento da condenação, requer-se expedição de alvará judicial;</p>
</div>
<p style="text-align:center;margin-bottom:8px">Após, sem oposição ao arquivamento.</p>
<p style="text-align:center;margin-bottom:20px">Nestes termos, pede deferimento.</p>
<p style="text-align:center;margin-bottom:24px">${d.cidade}, ${dAssina}.</p>
<div class="pet-assinatura">
  ${d.adv_nome}<br>
  ADVOGADO<br>
  ${d.adv_oab_assina}
</div>`;
  },

  /** Gera texto puro da petição para PDF/RTF */
  RENDER_TEXT(d){
    const fmt=FinancialEngine.fmt.bind(FinancialEngine);
    const ext=numExtenso;
    const fmtExt=(v)=>`R$ ${fmt(v)} (${ext(v)})`;
    const dAssina=d.data_assina?dataExtenso(d.data_assina):dataExtenso(new Date().toISOString().slice(0,10));
    const dataApurFmt=d.data_apuracao?new Date(d.data_apuracao+'T00:00:00').toLocaleDateString('pt-BR'):'';

    let blocoPresc='';
    if(d.tem_prescricao){
      blocoPresc=`\n          Registre-se que, a parte Requerida descontou d${d.pronome_a} ${d.autor_a} parcelas desde ${d.ano_inicio_real}, porém, em razão da prescrição quinquenal, para fins de cálculos, apenas fora utilizado o período de ${d.data_ini_descontos} até ${d.data_fim_comp}. Logo, as parcelas de ${d.data_ini_descontos} até ${d.data_fim_comp}, foram utilizadas para compensar a parte Requerida do valor de ${fmtExt(d.valorComp)}, razão pela qual, não fazem parte dos cálculos desta execução.`;
    } else {
      blocoPresc=`\n          Importante é informar que, em razão da necessidade de compensação de valores em favor da Executada na quantia de ${fmtExt(d.valorComp)}, as parcelas de ${d.data_ini_descontos} a ${d.data_fim_comp}, foram revestidas em favor da executada visando a compensação dos valores, razão pela qual, não integram o cálculo de DANO MATERIAL.`;
    }

    return [
      `AO ${d.juizo_prefix} DA ${d.vara} DA COMARCA DE ${d.comarca}/${d.uf}.`,
      '',
      `Processo nº: ${d.processo}`,
      '',
      `          ${d.autor}, já qualificad${d.pronome_a}(a) nos autos, vem, respeitosamente, perante Vossa Excelência, por intermédio do seu advogado abaixo-assinado, iniciar a fase de CUMPRIMENTO DE SENTENÇA, nos seguintes termos:`,
      '',
      'I. DO CUMPRIMENTO DE SENTENÇA',
      '',
      `          Conforme ${d.tipo_decisao}, a parte Requerida fora condenada a devolver em dobro os valores que cobrou indevidamente da parte ${d.autor_a}, ou seja, os valores descontados do benefício d${d.pronome_a} ${d.autor_a} após a quitação do empréstimo ${d.desta_deste}.`,
      '',
      `          Houve ainda condenação do Requerido em danos morais, no valor de ${fmtExt(d.moraisSimples)}. No que diz respeito aos honorários, houve concessão destes em ${d.honPct}% sobre o valor da condenação.`,
      '',
      `          Por fim, fora determinado a compensação dos valores recebidos pel${d.pronome_a} ${d.autor_a} do Requerido, ou seja, a devolução dos valores recebidos a título de empréstimo ao Banco.`,
      '',
      `          Assim, havendo retorno dos autos da segunda instância cível, conforme as partes foram instadas a requerer o prosseguimento da execução/cumprimento de sentença.`,
      '',
      '          É o relatório necessário.',
      '',
      'II. DA APURAÇÃO DOS CÁLCULOS',
      '',
      `          Inicialmente, informa-se que os cálculos aqui apresentados, encontram-se apurados até a data de ${dataApurFmt}.`,
      '',
      `          Pois bem. Para fins de base na conversão do RMC, para consignado (utilizamos a taxa média do Bacen daquele ano), e dividimos tal valor em 24x.`,
      '',
      `          Logo, o valor sacado pel${d.pronome_a} parte ${d.autor_a} via RMC (somando TODOS os saques constantes aos autos) é de ${fmtExt(d.valorSaque)}. Porém, após converter o referido valor para a modalidade de empréstimo consignado, temos a quantia de ${fmtExt(d.valorComp)}, a título de consignado, sendo este o valor a ser compensado pel${d.pronome_a} parte ${d.autor_a} ao Banco.`,
      blocoPresc,
      '',
      `          Assim apurou-se que, as parcelas a partir de ${d.mes_indevido} foram descontadas d${d.pronome_a} ${d.autor_a} INDEVIDAMENTE, razão pela qual, as parcelas a partir de ${d.data_ini_indevido}, foram calculadas, corrigidas e cobradas na modalidade de repetição de indébito (conforme determinado em ${d.tipo_decisao}), perfazendo a quantia de ${fmtExt(d.danosMat)}, a título de danos materiais, conforme planilha e cálculos anexos.`,
      '',
      '── CÁLCULOS DA COMPENSAÇÃO ──────────────────────────────────────',
      `VALOR TOTAL DOS DESCONTOS (SIMPLES)    R$ ${fmt(d.totalDesc)}`,
      `VALOR A SER COMPENSADO                  R$ ${fmt(d.valorComp)}`,
      `RESULTADO DA COMPENSAÇÃO               R$ ${fmt(d.totalDesc)} - R$ ${fmt(d.valorComp)} = R$ ${fmt(d.matSimples)}`,
      '──────────────────────────────────────────────────────────────────',
      '',
      '── PLANILHA DE CÁLCULOS DA EXECUÇÃO ──────────────────────────────',
      `DANOS MATERIAIS (SIMPLES)              ${fmtExt(d.matSimples)}`,
      `DANOS MATERIAIS CONF. ${d.tipo_decisao.toUpperCase().slice(0,7)}         ${fmtExt(d.danosMat)}`,
      `DANOS MORAIS (SIMPLES)                 ${fmtExt(d.moraisSimples)}`,
      `DANOS MORAIS (ATUALIZADOS)             ${fmtExt(d.moraisAtu)}`,
      `HONORÁRIOS ADVOCATÍCIOS ${d.honPct}%            ${fmtExt(d.honorarios)}`,
      `VALOR TOTAL A SER EXECUTADO            ${fmtExt(d.totalExec)}`,
      '──────────────────────────────────────────────────────────────────',
      '',
      `          Assim sendo, pugna-se, pela intimação do Requerido para apresentar e COMPROVAR o pagamento voluntário da condenação no prazo legal de 15 dias úteis, no valor de ${fmtExt(d.totalExec)}, conforme a lei em vigor.`,
      '',
      '          Caso não ocorra o pagamento voluntário, pugna-se, automaticamente, desde já, pelo cumprimento forçado da obrigação, com acréscimo das penalidades previstas em lei, especialmente as constantes no Art. 523, § 1º e 3º, do CPC.',
      '',
      `          Outrossim, por ocasião do pagamento voluntário ou o bloqueio do referido valor em ação forçada, requer, desde já, a expedição do alvará judicial eletrônico em nome do patrono d${d.pronome_a} ${d.autor_a}, ${d.adv_nome}, ${d.adv_oab}, diretamente para a seguinte conta do escritório ${d.escritorio_nome}:`,
      '',
      `          Banco: ${d.banco_nome}`,
      `          Agência: ${d.banco_ag}`,
      `          Conta Corrente: ${d.banco_cc}`,
      `          CNPJ: ${d.banco_cnpj}`,
      '',
      'I. CONCLUSÃO',
      '',
      '          Ante o exposto, requer-se:',
      '',
      '          1. A intimação do Requerido para, no prazo de 15 (quinze) dias, caso queira efetuar o pagamento voluntário da condenação;',
      '          2. Havendo o pagamento da condenação, requer-se expedição de alvará judicial;',
      '',
      '          Após, sem oposição ao arquivamento.',
      '          Nestes termos, pede deferimento.',
      '',
      `${d.cidade}, ${dAssina}.`,
      '',
      d.adv_nome,
      'ADVOGADO',
      d.adv_oab_assina
    ].join('\n');
  }
};

/** Seleciona escritório e preenche campos do advogado */

// -- exports para outros modulos --
window.numExtenso = numExtenso;
window.dataExtenso = dataExtenso;
window.PetitionEngine = PetitionEngine;
