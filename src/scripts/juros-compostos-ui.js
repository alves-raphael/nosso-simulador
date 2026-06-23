'use strict';

import IMask from 'imask';
import { calcular } from './juros-compostos-calculator.js';

const MONEY_MASK = {
  mask: Number,
  thousandsSeparator: '.',
  radix: ',',
  scale: 2,
  padFractionalZeros: false,
  normalizeZeros: true,
  signed: false,
};

const PERCENT_MASK = {
  mask: Number,
  radix: ',',
  scale: 4,
  padFractionalZeros: false,
  normalizeZeros: true,
  signed: false,
  min: 0,
};

const formatBRL = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value);

function taxaMensalEquivalente(taxa, periodicidade) {
  return periodicidade === 'mes' ? taxa / 100 : Math.pow(1 + taxa / 100, 1 / 12) - 1;
}

// ─── Validação ───────────────────────────────────────────────────────────────

function validar(masks) {
  const ids = ['valorInicial', 'aporteMensal', 'taxaJuros', 'periodo'];
  ids.forEach((id) => {
    document.getElementById(id).classList.remove('is-invalid');
    document.getElementById(`erro-${id}`).textContent = '';
  });

  const valorInicial         = masks.valorInicial.typedValue || 0;
  const aporteMensal         = masks.aporteMensal.typedValue  || 0;
  const taxaJuros            = masks.taxaJuros.typedValue     ?? NaN;
  const periodo              = parseInt(document.getElementById('periodo').value, 10);
  const periodicidadeTaxa    = document.querySelector('input[name="periodicidadeTaxa"]:checked').value;
  const periodicidadePeriodo = document.querySelector('input[name="periodicidadePeriodo"]:checked').value;

  let valido = true;
  const erro = (id, msg) => {
    document.getElementById(id).classList.add('is-invalid');
    document.getElementById(`erro-${id}`).textContent = msg;
    valido = false;
  };

  if (valorInicial < 0)                                  erro('valorInicial', 'O valor inicial não pode ser negativo.');
  if (aporteMensal < 0)                                  erro('aporteMensal', 'O aporte mensal não pode ser negativo.');
  if (!valorInicial && !aporteMensal)                    erro('valorInicial', 'Informe um valor inicial ou um aporte mensal.');
  if (isNaN(taxaJuros) || taxaJuros <= 0)                erro('taxaJuros', 'Informe uma taxa de juros positiva.');
  if (!periodo || periodo < 1 || !Number.isInteger(periodo)) erro('periodo', 'Informe um período válido (mínimo 1).');

  const taxaMensal = taxaMensalEquivalente(taxaJuros, periodicidadeTaxa);
  const meses       = periodicidadePeriodo === 'ano' ? periodo * 12 : periodo;

  return valido
    ? { valido: true, data: { valorInicial, aporteMensal, taxaMensal, meses } }
    : { valido: false };
}

// ─── Renderização ────────────────────────────────────────────────────────────

function renderizarResumo(resultado) {
  document.getElementById('resumo-totalAportado').textContent = formatBRL(resultado.totalAportado);
  document.getElementById('resumo-totalJuros').textContent    = formatBRL(resultado.totalJuros);
  document.getElementById('resumo-montanteFinal').textContent = formatBRL(resultado.montanteFinal);
}

function renderizarTabela(resultado) {
  const fragment = document.createDocumentFragment();

  resultado.parcelas.forEach(({ mes, saldoInicial, juros, aporte, saldoFinal }) => {
    const tr = document.createElement('tr');
    if (mes > 1 && (mes - 1) % 12 === 0) tr.classList.add('row-ano-novo');

    tr.innerHTML = `
      <td class="text-center">${mes}</td>
      <td class="text-end">${formatBRL(saldoInicial)}</td>
      <td class="text-end">${formatBRL(juros)}</td>
      <td class="text-end">${formatBRL(aporte)}</td>
      <td class="text-end">${formatBRL(saldoFinal)}</td>
    `;
    fragment.appendChild(tr);
  });

  const tbody = document.getElementById('resultado-body');
  tbody.innerHTML = '';
  tbody.appendChild(fragment);

  renderizarResumo(resultado);

  const container = document.getElementById('resultado-container');
  container.classList.remove('d-none');
  container.scrollIntoView({ behavior: 'smooth' });
}

function limparResultado(masks) {
  document.getElementById('resultado-container').classList.add('d-none');
  document.getElementById('resultado-body').innerHTML = '';
  ['valorInicial', 'aporteMensal', 'taxaJuros', 'periodo'].forEach((id) =>
    document.getElementById(id).classList.remove('is-invalid')
  );
  Object.values(masks).forEach((m) => { m.unmaskedValue = ''; });
}

// ─── Init ────────────────────────────────────────────────────────────────────

function init() {
  const masks = {
    valorInicial: IMask(document.getElementById('valorInicial'), MONEY_MASK),
    aporteMensal: IMask(document.getElementById('aporteMensal'), MONEY_MASK),
    taxaJuros:    IMask(document.getElementById('taxaJuros'),    PERCENT_MASK),
  };

  document.getElementById('form-juros-compostos').addEventListener('submit', (e) => {
    e.preventDefault();
    const { valido, data } = validar(masks);
    if (!valido) return;
    renderizarTabela(calcular(data));
  });

  document.getElementById('form-juros-compostos').addEventListener('reset', () => {
    limparResultado(masks);
  });
}

document.addEventListener('DOMContentLoaded', init);
