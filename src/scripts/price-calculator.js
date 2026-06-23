'use strict';

function parcelaPrice(saldo, taxaMensal, prazoRestante) {
  if (taxaMensal === 0) return saldo / prazoRestante;
  return (saldo * taxaMensal) / (1 - Math.pow(1 + taxaMensal, -prazoRestante));
}

function calcularCenario(valorFinanciado, taxaMensal, prazo, extrasMap, tipoAmortizacao) {
  let saldo = valorFinanciado;
  let parcelaFixa = parcelaPrice(valorFinanciado, taxaMensal, prazo);
  let totalJuros = 0;
  let totalPago  = 0;
  let prazoEfetivo = prazo;
  const parcelas = [];

  for (let mes = 1; mes <= prazo; mes++) {
    if (saldo < 0.005) {
      prazoEfetivo = mes - 1;
      break;
    }

    const saldoInicial = saldo;
    const juros        = saldo * taxaMensal;
    const amortRegular = Math.min(Math.max(parcelaFixa - juros, 0), saldo);
    const maxExtra      = Math.max(0, saldo - amortRegular);
    const amortExtra    = Math.min(extrasMap[mes] || 0, maxExtra);

    saldo -= amortRegular + amortExtra;
    if (saldo < 0.005) saldo = 0;

    const parcela = amortRegular + amortExtra + juros;
    totalJuros   += juros;
    totalPago    += parcela;

    parcelas.push({ mes, saldoInicial, amortizacao: amortRegular, amortExtra, juros, parcela, saldoFinal: saldo });

    if (saldo === 0) {
      prazoEfetivo = mes;
      break;
    }

    if (tipoAmortizacao === 'reduzir-parcela' && amortExtra > 0) {
      const mesesRestantes = prazo - mes;
      if (mesesRestantes > 0) parcelaFixa = parcelaPrice(saldo, taxaMensal, mesesRestantes);
    }
  }

  if (saldo >= 0.005) prazoEfetivo = prazo;

  return { parcelas, totalJuros, totalPago, prazoEfetivo };
}

export function calcular({ valorFinanciado, taxaAnualPercent, prazo, amortizacoesExtras, tipoAmortizacao }) {
  const taxaMensal = Math.pow(1 + taxaAnualPercent / 100, 1 / 12) - 1;

  const base           = calcularCenario(valorFinanciado, taxaMensal, prazo, {}, 'reduzir-prazo');
  const comAmortizacao = calcularCenario(valorFinanciado, taxaMensal, prazo, amortizacoesExtras, tipoAmortizacao);

  return { base, comAmortizacao };
}
