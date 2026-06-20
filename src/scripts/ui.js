'use strict';

import IMask from 'imask';
import { calcular } from './calculator.js';

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

const formatReajuste = (fator) =>
  '+' + ((fator - 1) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';

// ─── Validação ───────────────────────────────────────────────────────────────

function validar(masks) {
  const ids = ['valorImovel', 'taxaAdm', 'meses', 'reajuste', 'valorAluguel', 'taxaCorrecaoAluguel'];
  ids.forEach((id) => {
    document.getElementById(id).classList.remove('is-invalid');
    document.getElementById(`erro-${id}`).textContent = '';
  });

  const valorImovel         = masks.valorImovel.typedValue         || 0;
  const taxaAdm             = masks.taxaAdm.typedValue             || 0;
  const meses               = parseInt(document.getElementById('meses').value, 10);
  const reajuste            = masks.reajuste.typedValue            ?? NaN;
  const valorAluguel        = masks.valorAluguel.typedValue        || 0;
  const taxaCorrecaoAluguel = masks.taxaCorrecaoAluguel.typedValue ?? NaN;

  let valido = true;
  const erro = (id, msg) => {
    document.getElementById(id).classList.add('is-invalid');
    document.getElementById(`erro-${id}`).textContent = msg;
    valido = false;
  };

  if (!valorImovel || valorImovel <= 0)      erro('valorImovel', 'Informe um valor do imóvel positivo.');
  if (!taxaAdm || taxaAdm <= 0)              erro('taxaAdm', 'Informe uma taxa de administração positiva.');
  if (!meses || meses < 1 || !Number.isInteger(meses)) erro('meses', 'Informe um número de meses válido (mínimo 1).');
  if (isNaN(reajuste) || reajuste < 0)       erro('reajuste', 'Informe um reajuste anual válido (mínimo 0%).');
  if (valorAluguel < 0)                      erro('valorAluguel', 'O valor do aluguel não pode ser negativo.');
  if (valorAluguel > 0 && (isNaN(taxaCorrecaoAluguel) || taxaCorrecaoAluguel < 0))
    erro('taxaCorrecaoAluguel', 'Informe uma taxa de correção válida (mínimo 0%).');

  return valido
    ? { valido: true, data: { valorImovel, taxaAdm, meses, reajuste, valorAluguel, taxaCorrecaoAluguel } }
    : { valido: false };
}

// ─── Renderização ────────────────────────────────────────────────────────────

function renderizarResumo(resultado) {
  document.getElementById('resumo-taxaAdm').textContent     = formatBRL(resultado.taxaAdmTotal);
  document.getElementById('resumo-totalBruto').textContent  = formatBRL(resultado.totalBruto);
  document.getElementById('resumo-quotaBase').textContent   = formatBRL(resultado.quotaBase);
  document.getElementById('resumo-totalPago').textContent   = formatBRL(resultado.totalPago);
  document.getElementById('resumo-totalAluguel').textContent = formatBRL(resultado.totalAluguel);
}

function renderizarTabela(resultado, comAluguel) {
  const container = document.getElementById('resultado-container');
  container.classList.toggle('sem-aluguel', !comAluguel);

  const fragment = document.createDocumentFragment();
  resultado.parcelas.forEach(({ mes, fatorReajuste, parcela, totalAcumulado, aluguelAcumulado }) => {
    const tr = document.createElement('tr');
    if (mes > 1 && (mes - 1) % 12 === 0) tr.classList.add('row-ano-novo');

    tr.innerHTML = `
      <td class="text-center">${mes}</td>
      <td class="text-center">${formatReajuste(fatorReajuste)}</td>
      <td class="text-end">${formatBRL(parcela)}</td>
      <td class="text-end">${formatBRL(totalAcumulado)}</td>
      <td class="col-aluguel text-end">${formatBRL(aluguelAcumulado)}</td>
    `;
    fragment.appendChild(tr);
  });

  const tbody = document.getElementById('resultado-body');
  tbody.innerHTML = '';
  tbody.appendChild(fragment);

  document.getElementById('total-pago').textContent    = formatBRL(resultado.totalPago);
  document.getElementById('total-aluguel').textContent = formatBRL(resultado.totalAluguel);

  renderizarResumo(resultado);

  container.classList.remove('d-none');
  container.scrollIntoView({ behavior: 'smooth' });
}

function limparResultado(masks) {
  document.getElementById('resultado-container').classList.add('d-none');
  document.getElementById('resultado-body').innerHTML = '';
  ['valorImovel', 'taxaAdm', 'meses', 'reajuste', 'valorAluguel', 'taxaCorrecaoAluguel'].forEach((id) =>
    document.getElementById(id).classList.remove('is-invalid')
  );
  Object.values(masks).forEach((m) => { m.unmaskedValue = ''; });
}

// ─── Init ────────────────────────────────────────────────────────────────────

function init() {
  const masks = {
    valorImovel:         IMask(document.getElementById('valorImovel'),         MONEY_MASK),
    valorAluguel:        IMask(document.getElementById('valorAluguel'),        MONEY_MASK),
    taxaAdm:             IMask(document.getElementById('taxaAdm'),             PERCENT_MASK),
    reajuste:            IMask(document.getElementById('reajuste'),            PERCENT_MASK),
    taxaCorrecaoAluguel: IMask(document.getElementById('taxaCorrecaoAluguel'), PERCENT_MASK),
  };

  document.getElementById('form-simulador').addEventListener('submit', (e) => {
    e.preventDefault();
    const { valido, data } = validar(masks);
    if (!valido) return;
    renderizarTabela(calcular(data), data.valorAluguel > 0);
  });

  document.getElementById('form-simulador').addEventListener('reset', () => {
    limparResultado(masks);
  });

  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
    new bootstrap.Tooltip(el);
  });
}

document.addEventListener('DOMContentLoaded', init);
