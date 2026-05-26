// AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MODULO: core/library.js
'use strict';

//  LIBRARY — Harvard ROM Layer · Object.freeze · Dados Imutáveis
// ══════════════════════════════════════════════════════════════════════
const LIBRARY = Object.freeze({

  INDICES: Object.freeze({
    IPCA: Object.freeze({
      '2018-01':0.29,'2018-02':0.32,'2018-03':0.09,'2018-04':0.22,'2018-05':0.40,'2018-06':1.26,
      '2018-07':0.33,'2018-08':-0.09,'2018-09':0.48,'2018-10':0.45,'2018-11':-0.21,'2018-12':0.15,
      '2019-01':0.32,'2019-02':0.43,'2019-03':0.75,'2019-04':0.57,'2019-05':0.13,'2019-06':0.01,
      '2019-07':0.19,'2019-08':0.11,'2019-09':-0.04,'2019-10':0.10,'2019-11':0.51,'2019-12':1.15,
      '2020-01':0.21,'2020-02':0.25,'2020-03':0.07,'2020-04':-0.31,'2020-05':-0.38,'2020-06':0.26,
      '2020-07':0.36,'2020-08':0.24,'2020-09':0.64,'2020-10':0.86,'2020-11':0.89,'2020-12':1.35,
      '2021-01':0.25,'2021-02':0.86,'2021-03':0.93,'2021-04':0.31,'2021-05':0.83,'2021-06':0.53,
      '2021-07':0.96,'2021-08':0.87,'2021-09':1.16,'2021-10':1.25,'2021-11':0.95,'2021-12':0.73,
      '2022-01':0.54,'2022-02':1.01,'2022-03':1.62,'2022-04':1.06,'2022-05':0.47,'2022-06':0.67,
      '2022-07':-0.68,'2022-08':-0.73,'2022-09':0.59,'2022-10':0.59,'2022-11':0.41,'2022-12':0.62,
      '2023-01':0.53,'2023-02':0.84,'2023-03':0.71,'2023-04':0.61,'2023-05':0.23,'2023-06':-0.08,
      '2023-07':0.12,'2023-08':0.61,'2023-09':0.26,'2023-10':0.24,'2023-11':0.28,'2023-12':0.62,
      '2024-01':0.42,'2024-02':0.83,'2024-03':0.16,'2024-04':0.38,'2024-05':0.46,'2024-06':0.50,
      '2024-07':0.38,'2024-08':-0.02,'2024-09':0.44,'2024-10':0.56,'2024-11':0.39,'2024-12':0.52,
      '2025-01':0.16,'2025-02':1.31,'2025-03':1.32,'2025-04':0.43
    }),
    INPC: Object.freeze({
      '2018-01':0.22,'2018-02':0.25,'2018-03':0.07,'2018-04':0.22,'2018-05':0.44,'2018-06':1.16,
      '2018-07':0.28,'2018-08':-0.18,'2018-09':0.47,'2018-10':0.37,'2018-11':-0.27,'2018-12':0.01,
      '2019-01':0.31,'2019-02':0.52,'2019-03':0.93,'2019-04':0.67,'2019-05':0.26,'2019-06':-0.16,
      '2019-07':0.07,'2019-08':0.08,'2019-09':-0.08,'2019-10':0.18,'2019-11':0.59,'2019-12':1.22,
      '2020-01':0.24,'2020-02':0.26,'2020-03':0.01,'2020-04':-0.26,'2020-05':-0.27,'2020-06':0.51,
      '2020-07':0.68,'2020-08':0.48,'2020-09':0.99,'2020-10':1.00,'2020-11':0.95,'2020-12':1.42,
      '2021-01':0.59,'2021-02':0.96,'2021-03':0.96,'2021-04':0.47,'2021-05':0.90,'2021-06':0.72,
      '2021-07':0.96,'2021-08':0.89,'2021-09':1.30,'2021-10':1.24,'2021-11':1.10,'2021-12':0.58,
      '2022-01':0.69,'2022-02':0.98,'2022-03':1.71,'2022-04':1.24,'2022-05':0.50,'2022-06':0.77,
      '2022-07':-0.65,'2022-08':-0.73,'2022-09':0.54,'2022-10':0.65,'2022-11':0.53,'2022-12':0.69,
      '2023-01':0.48,'2023-02':0.64,'2023-03':0.68,'2023-04':0.49,'2023-05':0.15,'2023-06':-0.20,
      '2023-07':0.07,'2023-08':0.58,'2023-09':0.23,'2023-10':0.20,'2023-11':0.32,'2023-12':0.59,
      '2024-01':0.40,'2024-02':0.90,'2024-03':0.20,'2024-04':0.55,'2024-05':0.62,'2024-06':0.55,
      '2024-07':0.36,'2024-08':-0.02,'2024-09':0.48,'2024-10':0.55,'2024-11':0.32,'2024-12':0.49,
      '2025-01':0.12,'2025-02':1.22,'2025-03':1.27,'2025-04':0.48
    }),
    IGPM: Object.freeze({
      '2018-01':0.76,'2018-02':0.07,'2018-03':0.64,'2018-04':0.57,'2018-05':1.38,'2018-06':1.87,
      '2018-07':0.59,'2018-08':-0.82,'2018-09':1.08,'2018-10':0.90,'2018-11':-0.46,'2018-12':-0.20,
      '2019-01':0.18,'2019-02':0.68,'2019-03':1.39,'2019-04':0.65,'2019-05':0.77,'2019-06':0.72,
      '2019-07':0.28,'2019-08':0.02,'2019-09':0.18,'2019-10':0.12,'2019-11':0.73,'2019-12':1.52,
      '2020-01':0.25,'2020-02':0.04,'2020-03':1.27,'2020-04':0.80,'2020-05':0.28,'2020-06':1.60,
      '2020-07':2.23,'2020-08':2.74,'2020-09':4.34,'2020-10':3.23,'2020-11':3.27,'2020-12':3.59,
      '2021-01':2.58,'2021-02':2.53,'2021-03':2.94,'2021-04':1.13,'2021-05':3.22,'2021-06':0.60,
      '2021-07':0.78,'2021-08':0.66,'2021-09':-0.64,'2021-10':-0.64,'2021-11':-0.42,'2021-12':0.87,
      '2022-01':1.82,'2022-02':1.83,'2022-03':1.74,'2022-04':1.62,'2022-05':0.52,'2022-06':0.59,
      '2022-07':-2.11,'2022-08':-0.56,'2022-09':-0.99,'2022-10':-0.28,'2022-11':-0.44,'2022-12':0.55,
      '2023-01':-0.12,'2023-02':-0.06,'2023-03':-0.06,'2023-04':0.84,'2023-05':-1.84,'2023-06':-1.93,
      '2023-07':-0.72,'2023-08':0.54,'2023-09':0.37,'2023-10':0.66,'2023-11':0.39,'2023-12':0.74,
      '2024-01':0.07,'2024-02':0.78,'2024-03':0.47,'2024-04':0.89,'2024-05':0.74,'2024-06':0.81,
      '2024-07':0.61,'2024-08':0.29,'2024-09':0.62,'2024-10':1.52,'2024-11':1.35,'2024-12':0.94,
      '2025-01':0.44,'2025-02':1.06,'2025-03':0.76,'2025-04':0.15
    }),
    SELIC: Object.freeze({
      '2018-01':0.58,'2018-02':0.56,'2018-03':0.53,'2018-04':0.52,'2018-05':0.52,'2018-06':0.52,
      '2018-07':0.54,'2018-08':0.57,'2018-09':0.47,'2018-10':0.54,'2018-11':0.49,'2018-12':0.49,
      '2019-01':0.54,'2019-02':0.49,'2019-03':0.47,'2019-04':0.52,'2019-05':0.53,'2019-06':0.47,
      '2019-07':0.57,'2019-08':0.50,'2019-09':0.46,'2019-10':0.48,'2019-11':0.38,'2019-12':0.37,
      '2020-01':0.38,'2020-02':0.34,'2020-03':0.34,'2020-04':0.28,'2020-05':0.24,'2020-06':0.21,
      '2020-07':0.19,'2020-08':0.16,'2020-09':0.16,'2020-10':0.16,'2020-11':0.15,'2020-12':0.16,
      '2021-01':0.15,'2021-02':0.12,'2021-03':0.20,'2021-04':0.21,'2021-05':0.27,'2021-06':0.29,
      '2021-07':0.35,'2021-08':0.43,'2021-09':0.44,'2021-10':0.48,'2021-11':0.59,'2021-12':0.73,
      '2022-01':0.73,'2022-02':0.76,'2022-03':0.93,'2022-04':0.83,'2022-05':1.03,'2022-06':1.03,
      '2022-07':1.03,'2022-08':1.03,'2022-09':1.03,'2022-10':0.83,'2022-11':1.02,'2022-12':1.07,
      '2023-01':1.07,'2023-02':0.93,'2023-03':1.07,'2023-04':0.83,'2023-05':0.87,'2023-06':0.81,
      '2023-07':0.81,'2023-08':0.81,'2023-09':0.81,'2023-10':0.92,'2023-11':0.92,'2023-12':0.92,
      '2024-01':0.97,'2024-02':0.80,'2024-03':0.83,'2024-04':0.89,'2024-05':0.83,'2024-06':0.89,
      '2024-07':0.89,'2024-08':1.02,'2024-09':0.89,'2024-10':0.96,'2024-11':0.77,'2024-12':0.93,
      '2025-01':1.16,'2025-02':1.00,'2025-03':1.17,'2025-04':1.13
    }),

    // IPCA-E — IBGE · SGS 10764 · Usado pelo STJ e TJRJ (obrigações civis/contratos)
    IPCA_E: Object.freeze({
      '2018-01':0.39,'2018-02':0.38,'2018-03':0.10,'2018-04':0.21,'2018-05':0.14,'2018-06':1.11,
      '2018-07':0.64,'2018-08':0.13,'2018-09':0.09,'2018-10':0.58,'2018-11':0.19,'2018-12':-0.16,
      '2019-01':0.30,'2019-02':0.34,'2019-03':0.54,'2019-04':0.72,'2019-05':0.35,'2019-06':0.06,
      '2019-07':0.09,'2019-08':0.08,'2019-09':0.09,'2019-10':0.09,'2019-11':0.14,'2019-12':1.05,
      '2020-01':0.71,'2020-02':0.22,'2020-03':0.02,'2020-04':-0.01,'2020-05':-0.59,'2020-06':0.02,
      '2020-07':0.30,'2020-08':0.23,'2020-09':0.45,'2020-10':0.94,'2020-11':0.81,'2020-12':1.06,
      '2021-01':0.78,'2021-02':0.48,'2021-03':0.93,'2021-04':0.60,'2021-05':0.44,'2021-06':0.83,
      '2021-07':0.72,'2021-08':0.89,'2021-09':1.14,'2021-10':1.20,'2021-11':1.17,'2021-12':0.78,
      '2022-01':0.58,'2022-02':0.99,'2022-03':0.95,'2022-04':1.73,'2022-05':0.59,'2022-06':0.69,
      '2022-07':0.13,'2022-08':-0.73,'2022-09':-0.37,'2022-10':0.16,'2022-11':0.53,'2022-12':0.52,
      '2023-01':0.55,'2023-02':0.76,'2023-03':0.69,'2023-04':0.57,'2023-05':0.51,'2023-06':0.04,
      '2023-07':-0.07,'2023-08':0.28,'2023-09':0.35,'2023-10':0.21,'2023-11':0.33,'2023-12':0.40,
      '2024-01':0.31,'2024-02':0.78,'2024-03':0.36,'2024-04':0.21,'2024-05':0.44,'2024-06':0.39,
      '2024-07':0.30,'2024-08':0.19,'2024-09':0.13,'2024-10':0.54,'2024-11':0.62,'2024-12':0.34,
      '2025-01':0.11,'2025-02':1.23,'2025-03':0.64,'2025-04':0.43
    })
  }),

  KEYWORDS: Object.freeze({
    RMC:           ['RMC','RESERVA DE MARGEM','CARTAO CONSIGNADO','CONSIG CART','CRED CONSIG CART','RES MARG CART'],
    RCC:           ['RCC','RESERVA CARTAO','CART CONSIG','CONSIGNADO CARTAO','CARTAO CONSIG','CONSIG CARTAO','CONSIGNACAO CARTAO','RCC CARTAO','DEB CART CONSIG'],
    BX_FINAN:      ['BX ANT.FINAN','BX.ANT.FINANC','BAIXA ANTECIPADA','REFINANCIAMENTO','REFI EMP'],
    TARIFA:        ['TARIFA','ANUIDADE','CESTA','PACOTE SERV','EMIS EXTRATO','SAQUE TERM','SAQUE 24H','TAR MANUT','CESTA BASICA DE SERVICO','CESTA BASICA SERVICOS','CLUBE DE BENEFICIOS','CLUBE BENEFICIO'],
    SEGURO:        ['SEGURO','PRESTAMISTA','SEGPREST','SEG PREST','SEG VIDA','SEG CAPIT','SEGURO CARTAO'],
    JUROS:         ['JUROS','MORA','IOF','ENC FINANC','ENCARGOS','JUROS CART','JUROS SALDO DEVEDOR','COBRANCA DE JUROS','COBRANÇA DE JUROS','COBR JUROS'],
    PARCELA:       ['PARCELA','CREDITO PESSOAL','EMPRÉST','EMPR PESSOAL','CRED PESSOAL','CONSIG EMP','CREDITO CONSIGNADO','PGTO INSS','ADIANT.DEPOSITANTE'],
    CARTAO_CREDITO:['GASTOS CARTAO DE CREDITO','PAGTO CARTAO','PAGAMENTO CARTAO','DEB CARTAO','FATURA CARTAO','OUROCARD','CARTAO VISA','CARTAO ELO','FAT CARTAO']
  }),

  JURIDICO: Object.freeze({
    LEI_14905_SPLIT: '2024-08-30',
    TAXA_MORA_PRE: 1.0,
    TAU_0: 1.0,
    LAMBDA: 0.1,
    IC_MIN: 0.9
  }),

  // Configurações SGS/BACEN para taxas de crédito consignado (CORS habilitado)
  BACEN_SGS: Object.freeze({
    INSS:    Object.freeze({ sgsCodigo:25468, modalidade:402101, label:'Consignado INSS (Beneficiário/Aposentado)' }),
    PUBLICO: Object.freeze({ sgsCodigo:25469, modalidade:402201, label:'Consignado Público (Servidor)' }),
    PRIVADO: Object.freeze({ sgsCodigo:25470, modalidade:402301, label:'Consignado Privado (CLT/Empregado)' })
  }),

  // Mapeamento de rubricas INSS → categoria (usados pelo INSSParser)
  INSS_CODES: Object.freeze({
    '101':'OUTROS',   // Valor Total MR do Período (bruto/referência)
    '137':'OUTROS',   // Adiantamento p/arredondamento do crédito
    '201':'OUTROS',   // IRRF
    '207':'OUTROS',   // IR 13° Salário
    '216':'PARCELA',  // Consignação Empréstimo Bancário
    '217':'RMC',      // Empréstimo sobre a RMC
    '218':'OUTROS',   // Varia por documento
    '221':'SEGURO',   // Seguro Prestamista
    '222':'SEGURO',   // Seguro de Vida
    '268':'RCC',      // Consignação Cartão (RCC)
    '303':'OUTROS',   // Abatimento beneficiário maior 65 anos
    '316':'OUTROS',   // Saldo devedor arredondamento
    '322':'RMC'       // Reserva de Margem Consignável (RMC)
  })
});


// ══════════════════════════════════════════════════════════════════════


const ESCRITORIOS=Object.freeze({
  LAADV:{
    id:'LAADV',
    adv_nome:'LUIS ALBERT DOS SANTOS OLIVEIRA',
    adv_oab:'OAB/RJ 240.091',
    adv_oab_assina:'OAB/RJ n°240091',
    escritorio_nome:'LUIS ALBERT DOS SANTOS OLIVEIRA SOCIEDADE INDIVIDUAL DE ADVOCACIA',
    banco_nome:'SICREDI (748)',
    banco_ag:'4501',
    banco_cc:'40721-6',
    banco_cnpj:'27.131.836/0002-62',
    cidade:'Rio de Janeiro',
    email:'contato_riodejaneiro@luisalbertadv.com.br',
    tel:'(21) 99828-2924',
    cor_primaria:[11,74,68],
    cor_acento:[201,169,62]
  },
  NG:{
    id:'NG',
    adv_nome:'NICOLAS SANTOS CARVALHO GOMES',
    adv_oab:'OAB/AM 8.926',
    adv_oab_assina:'OAB/AM 8.926 | OAB/PA 32.769 | OAB/PA 37.146 | OAB/RJ 261.244',
    escritorio_nome:'NICOLAS GOMES SOCIEDADE INDIVIDUAL DE ADVOCACIA (OAB/AM 796/2022)',
    banco_nome:'SICREDI (748)',
    banco_ag:'0802',
    banco_cc:'79472-8',
    banco_cnpj:'46.533.658/0001-60',
    cidade:'Manaus',
    email:'nicolas.advogado@outlook.com',
    tel:'(92) 98270-2808',
    cor_primaria:[21,101,192],
    cor_acento:[201,169,62]
  },
  LAADV_AM:{
    id:'LAADV_AM',
    adv_nome:'LUIS ALBERT DOS SANTOS OLIVEIRA',
    adv_oab:'OAB/AM 8.251',
    adv_oab_assina:'OAB/AM nº 8.251',
    adv_oab2_nome:'ALESSANDRA VIRGINIA LOPES BRAGA',
    adv_oab2:'OAB/AM 15.217',
    escritorio_nome:'LUIS ALBERT DOS SANTOS OLIVEIRA SOCIEDADE INDIVIDUAL DE ADVOCACIA',
    banco_nome:'SICREDI (748)',
    banco_ag:'0802',
    banco_cc:'66245-4',
    banco_cnpj:'27.131.836/0001-81',
    cidade:'Manaus',
    email:'contato@luisalbertadv.com.br',
    tel:'(92) 99000-0000',
    cor_primaria:[11,74,68],
    cor_acento:[201,169,62]
  }
});

// ══════════════════════════════════════════════════════════════════════
//  LIBRARY._meta — Versionamento de Fontes (TASK-007)
//  AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0
// ══════════════════════════════════════════════════════════════════════
const LIBRARY_META = Object.freeze({
  IPCA: Object.freeze({
    nome: 'Índice Nacional de Preços ao Consumidor Amplo',
    orgao: 'IBGE via BACEN SGS',
    serie_sgs: 433,
    url_sgs: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados',
    cobertura_inicio: '2018-01',
    cobertura_fim: '2025-04',
    ultima_atualizacao: '2026-05',
    uso: 'Correção monetária geral e pós-Lei 14.905/2024'
  }),
  INPC: Object.freeze({
    nome: 'Índice Nacional de Preços ao Consumidor',
    orgao: 'IBGE via BACEN SGS',
    serie_sgs: 188,
    url_sgs: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.188/dados',
    cobertura_inicio: '2018-01',
    cobertura_fim: '2025-04',
    ultima_atualizacao: '2026-05',
    uso: 'Correção monetária TJRJ/TJAM + pré-Lei 14.905/2024 (INSS/servidor)'
  }),
  IGPM: Object.freeze({
    nome: 'Índice Geral de Preços — Mercado',
    orgao: 'FGV via BACEN SGS',
    serie_sgs: 189,
    url_sgs: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.189/dados',
    cobertura_inicio: '2018-01',
    cobertura_fim: '2025-04',
    ultima_atualizacao: '2026-05',
    uso: 'Correção monetária contratos privados'
  }),
  SELIC: Object.freeze({
    nome: 'Taxa SELIC Over (acumulada mensal)',
    orgao: 'BACEN SGS',
    serie_sgs: 11,
    url_sgs: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados',
    cobertura_inicio: '2018-01',
    cobertura_fim: '2025-04',
    ultima_atualizacao: '2026-05',
    uso: 'Juros pós-Lei 14.905/2024'
  }),
  IPCA_E: Object.freeze({
    nome: 'IPCA Especial (IPCA-E)',
    orgao: 'IBGE via BACEN SGS',
    serie_sgs: 10764,
    url_sgs: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.10764/dados',
    cobertura_inicio: '2018-01',
    cobertura_fim: '2025-04',
    ultima_atualizacao: '2026-05',
    uso: 'Correção monetária TJDFT (Precatórios Federal)'
  }),
  TAXA_MEDIA_CONSIGNADO_INSS: Object.freeze({
    nome: 'Taxa Média — Crédito Consignado INSS',
    orgao: 'BACEN SGS',
    serie_sgs: 25468,
    modalidade: 402101,
    url_sgs: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.25468/dados',
    nota: 'Média ponderada por volume das novas concessões do mês. Pode diferir ±0,03–0,10% do relatório histórico pontual BACEN por agregação em períodos semanais distintos. Ambas as fontes são oficiais e igualmente válidas para fins judiciais.',
    ultima_atualizacao: '2026-05',
    uso: 'Taxa de juros para cálculo PMT (fórmula Price) — Beneficiário/Aposentado'
  }),
  TAXA_MEDIA_CONSIGNADO_PUBLICO: Object.freeze({
    nome: 'Taxa Média — Crédito Consignado Servidor Público',
    orgao: 'BACEN SGS',
    serie_sgs: 25469,
    modalidade: 402201,
    url_sgs: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.25469/dados',
    ultima_atualizacao: '2026-05',
    uso: 'Taxa de juros para cálculo PMT — Servidor Público'
  }),
  TAXA_MEDIA_CONSIGNADO_PRIVADO: Object.freeze({
    nome: 'Taxa Média — Crédito Consignado Privado',
    orgao: 'BACEN SGS',
    serie_sgs: 25470,
    modalidade: 402301,
    url_sgs: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.25470/dados',
    ultima_atualizacao: '2026-05',
    uso: 'Taxa de juros para cálculo PMT — CLT/Empregado Privado'
  }),
  _plataforma: Object.freeze({
    versao_library: '1.7.0',
    build: 'LAADV-20260524',
    protocolo: 'AKE/UFT-1.0',
    nota_metodologica: 'Todos os índices provêm de fontes oficiais (IBGE/FGV/BACEN). A diferença entre a série SGS e o relatório histórico pontual do site BACEN é de ±0,03–0,10% por metodologia de agregação semanal — irrelevante juridicamente. O SGS é a referência mais defensável por publicação oficial contínua.'
  })
});

// -- exports para outros modulos --
window.LIBRARY = LIBRARY;
window.LIBRARY_META = LIBRARY_META;
window.ESCRITORIOS = ESCRITORIOS;
