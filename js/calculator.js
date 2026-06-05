'use strict';

const Calculator = (() => {
  function calcular({ valorImovel, taxaAdm, meses }) {
    const credito      = valorImovel;
    const taxaAdmTotal = credito * (taxaAdm / 100);
    const totalBruto   = credito + taxaAdmTotal;
    const quotaBase    = totalBruto / meses;

    let totalAcumulado = 0;
    const parcelas = [];

    for (let i = 1; i <= meses; i++) {
      const anoAtual      = Math.floor((i - 1) / 12);
      const fatorReajuste = Math.pow(1.05, anoAtual);
      const parcela       = quotaBase * fatorReajuste;

      totalAcumulado += parcela;

      parcelas.push({ mes: i, fatorReajuste, parcela, totalAcumulado });
    }

    return {
      credito,
      taxaAdmTotal,
      totalBruto,
      quotaBase,
      parcelas,
      totalPago: totalAcumulado,
    };
  }

  return { calcular };
})();
