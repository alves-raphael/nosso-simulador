'use strict';

export function calcular({ valorInicial, aporteMensal, taxaMensal, meses }) {
  let saldo         = valorInicial;
  let totalAportado = valorInicial;
  let totalJuros    = 0;
  const parcelas = [];

  for (let mes = 1; mes <= meses; mes++) {
    const saldoInicial = saldo;
    const juros        = saldo * taxaMensal;

    saldo += juros + aporteMensal;
    totalJuros    += juros;
    totalAportado += aporteMensal;

    parcelas.push({ mes, saldoInicial, juros, aporte: aporteMensal, saldoFinal: saldo });
  }

  return { parcelas, totalAportado, totalJuros, montanteFinal: saldo };
}
