'use strict';

const IR_TABELA = [
  { diasMax: 180,      aliquota: 0.225 },
  { diasMax: 360,      aliquota: 0.20  },
  { diasMax: 720,      aliquota: 0.175 },
  { diasMax: Infinity, aliquota: 0.15  },
];

function getAliquotaIR(diasCorridos) {
  return IR_TABELA.find((f) => diasCorridos <= f.diasMax).aliquota;
}

export function calcular({ valorInicial, meses, cdiAnual, percentualCDB, percentualLCI }) {
  const diasCorridos = meses * 30;
  const diasUteis    = meses * 21;

  const cdiDiario = Math.pow(1 + cdiAnual / 100, 1 / 252) - 1;

  // CDB
  const cdbDiario    = cdiDiario * (percentualCDB / 100);
  const rendBrutoCDB = valorInicial * (Math.pow(1 + cdbDiario, diasUteis) - 1);
  const aliquota     = getAliquotaIR(diasCorridos);
  const ir           = rendBrutoCDB * aliquota;
  const rendLiqCDB   = rendBrutoCDB - ir;

  // LCI (isenta de IR)
  const lciDiario    = cdiDiario * (percentualLCI / 100);
  const rendBrutoLCI = valorInicial * (Math.pow(1 + lciDiario, diasUteis) - 1);
  const rendLiqLCI   = rendBrutoLCI;

  return {
    cdb: {
      rendimentoBruto:      rendBrutoCDB,
      aliquota,
      ir,
      rendimentoLiquido:    rendLiqCDB,
      valorFinal:           valorInicial + rendLiqCDB,
      rentabilidadeLiquida: (rendLiqCDB / valorInicial) * 100,
    },
    lci: {
      rendimentoBruto:      rendBrutoLCI,
      rendimentoLiquido:    rendLiqLCI,
      valorFinal:           valorInicial + rendLiqLCI,
      rentabilidadeLiquida: (rendLiqLCI / valorInicial) * 100,
    },
    // % do CDI que a LCI precisaria pagar para empatar com o CDB após IR
    lciEquivalente: percentualCDB * (1 - aliquota),
    melhor:         rendLiqCDB >= rendLiqLCI ? 'CDB' : 'LCI',
    diferenca:      Math.abs(rendLiqCDB - rendLiqLCI),
  };
}
