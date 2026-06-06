'use strict';

export function calcular({ valorImovel, taxaAdm, meses, reajuste, valorAluguel, taxaCorrecaoAluguel }) {
  const credito           = valorImovel;
  const taxaAdmTotal      = credito * (taxaAdm / 100);
  const totalBruto        = credito + taxaAdmTotal;
  const quotaBase         = totalBruto / meses;
  const fatorAnual        = 1 + reajuste / 100;
  const fatorAluguelAnual = 1 + taxaCorrecaoAluguel / 100;

  let totalAcumulado   = 0;
  let aluguelAcumulado = 0;
  const parcelas = [];

  for (let i = 1; i <= meses; i++) {
    const anoAtual      = Math.floor((i - 1) / 12);
    const fatorReajuste = Math.pow(fatorAnual, anoAtual);
    const parcela       = quotaBase * fatorReajuste;
    const aluguelMes    = valorAluguel * Math.pow(fatorAluguelAnual, anoAtual);

    aluguelAcumulado += aluguelMes;
    totalAcumulado   += parcela;

    parcelas.push({ mes: i, fatorReajuste, parcela, totalAcumulado, aluguelMes, aluguelAcumulado });
  }

  return {
    credito,
    taxaAdmTotal,
    totalBruto,
    quotaBase,
    parcelas,
    totalPago:    totalAcumulado,
    totalAluguel: aluguelAcumulado,
  };
}
