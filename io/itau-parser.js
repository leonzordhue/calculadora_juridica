// AKE/UFT-1.0 | BUILD: LAADV-20260526 | IC: 1.0 | MODULO: io/itau-parser.js
'use strict';

class ItauParser {
  constructor() {
    this.CFG = { yGap: 8, valMin: 0.01, valMax: 200000 };
  }

  async parse(file, onProgress) {
    if (typeof pdfjsLib === 'undefined') throw new Error('PDF.js não carregado.');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const itens = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      if (onProgress) onProgress(p, pdf.numPages);
      const pg = await pdf.getPage(p);
      const ct = await pg.getTextContent();
      const linhas = this._agruparLinhas(ct.items);
      for (const l of linhas) itens.push(...this._parseLinha(l));
    }
    return this._classificar(this._dedup(itens));
  }

  _agruparLinhas(items) {
    const sorted = [...items].sort((a, b) => {
      const dy = Math.abs(b.transform[5] - a.transform[5]);
      return dy > this.CFG.yGap ? b.transform[5] - a.transform[5] : a.transform[4] - b.transform[4];
    });
    const linhas = []; let cur = null;
    for (const it of sorted) {
      const y = it.transform[5];
      if (!cur || Math.abs(y - cur.y) > this.CFG.yGap) { cur = { y, txt: '' }; linhas.push(cur); }
      cur.txt += (cur.txt ? ' ' : '') + it.str.trim();
    }
    return linhas.map(l => l.txt).filter(t => t.length > 0);
  }

  _parseLinha(linha) {
    // Ignorar linhas de cabeçalho e saldos
    const up = linha.toUpperCase();
    if (up.includes('SALDO DO DIA') || up.includes('SALDO (R$)') ||
        up.includes('LANÇAMENTOS') || up.includes('LANCAMENTOS') ||
        up.includes('DATA  LANÇAMENTOS') || up.includes('PERÍODO') ||
        up.includes('EMITIDO EM') || up.includes('AGÊNCIA:') ||
        up.includes('EXTRATO CONTA')) return [];

    const RE_TXN = /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?\d{1,3}(?:\.\d{3})*(?:,\d{2})?)$/;
    const m = linha.match(RE_TXN);
    if (!m) return [];
    const valorRaw = m[3];
    const v = this._pv(valorRaw);
    if (!v || v < this.CFG.valMin || v > this.CFG.valMax) return [];
    const negativo = valorRaw.startsWith('-');
    return [{
      data: this._nd(m[1]),
      desc: m[2].trim().toUpperCase(),
      tipo: negativo ? 'D' : 'C',
      valor: v
    }];
  }

  _pv(txt) {
    if (!txt) return null;
    const v = parseFloat(txt.replace(/[R$\s-]/g, '').replace(/\./g, '').replace(',', '.'));
    return isNaN(v) ? null : Math.abs(v);
  }

  _nd(d) {
    const p = d.split('/');
    if (p.length < 2) return d;
    let y = p[2] || new Date().getFullYear().toString();
    if (y.length === 2) y = '20' + y;
    return `${y}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
  }

  _dedup(itens) {
    const s = new Set();
    return itens.filter(it => {
      const k = `${it.data}|${it.desc}|${it.tipo}|${it.valor}`;
      if (s.has(k)) return false; s.add(k); return true;
    });
  }

  _classificar(itens) {
    return itens.map(it => {
      let cat = 'OUTROS', conf = 0.5;
      const up = it.desc.toUpperCase();
      for (const [c, kws] of Object.entries(LIBRARY.KEYWORDS)) {
        for (const kw of kws) {
          if (up.includes(kw)) { cat = c; conf = 0.7 + Math.min(kw.length, 12) / 40; break; }
        }
        if (cat !== 'OUTROS') break;
      }
      if (it.tipo === 'D' && ['RMC', 'RCC', 'SEGURO', 'TARIFA'].includes(cat)) conf = Math.min(conf + 0.15, 0.99);
      return { ...it, categoria: cat, confidence: +conf.toFixed(2) };
    });
  }
}

window.ItauParser = ItauParser;
