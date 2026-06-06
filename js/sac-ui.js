'use strict';

import IMask from 'imask';
import { calcular } from './sac-calculator.js';

const MONEY_MASK = {
  mask: Number,
  thousandsSeparator: '.',
  radix: ',',
  scale: 2,
  padFractionalZeros: false,
  normalizeZeros: true,
  signed: false,
};

let linhaCount  = 0;
const amortMasks = {}; // { [id]: IMask instance }

const formatBRL = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value);

// ─── Mini-tabela de amortizações extras ──────────────────────────────────────

function atualizarEstadoVazio() {
  const tbody     = document.getElementById('amort-extras-lista');
  const vazio     = document.getElementById('amort-extras-vazio');
  const temLinhas = tbody.querySelectorAll('tr:not(#amort-extras-vazio)').length > 0;
  vazio.classList.toggle('d-none', temLinhas);
}

function adicionarLinhaAmortizacao() {
  linhaCount++;
  const id    = linhaCount;
  const tbody = document.getElementById('amort-extras-lista');

  const tr  = document.createElement('tr');
  tr.id     = `amort-linha-${id}`;
  tr.innerHTML = `
    <td>
      <input type="number" class="form-control form-control-sm amort-mes"
        min="1" step="1" placeholder="Ex: 12" />
    </td>
    <td>
      <input type="text" inputmode="decimal" class="form-control form-control-sm amort-valor"
        placeholder="Ex: 50.000" data-mask-id="${id}" />
    </td>
    <td class="text-center align-middle">
      <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2"
        data-remove-id="${id}">✕</button>
    </td>
  `;
  tbody.appendChild(tr);

  amortMasks[id] = IMask(tr.querySelector('.amort-valor'), MONEY_MASK);
  atualizarEstadoVazio();
}

function coletarAmortizacoes() {
  const mapa = {};
  document.querySelectorAll('#amort-extras-lista tr:not(#amort-extras-vazio)').forEach((tr) => {
    const mes    = parseInt(tr.querySelector('.amort-mes').value, 10);
    const maskId = tr.querySelector('.amort-valor').dataset.maskId;
    const valor  = parseFloat(amortMasks[maskId]?.unmaskedValue) || 0;
    if (mes > 0 && valor > 0) mapa[mes] = (mapa[mes] || 0) + valor;
  });
  return mapa;
}

// ─── Validação ───────────────────────────────────────────────────────────────

function validar(masks) {
  const ids = ['valorImovel', 'entrada', 'taxaJuros', 'prazo'];
  ids.forEach((id) => {
    document.getElementById(id).classList.remove('is-invalid');
    document.getElementById(`erro-${id}`).textContent = '';
  });

  const valorImovel = parseFloat(masks.valorImovel.unmaskedValue) || 0;
  const entrada     = parseFloat(masks.entrada.unmaskedValue) || 0;
  const taxaJuros   = parseFloat(document.getElementById('taxaJuros').value);
  const prazo       = parseInt(document.getElementById('prazo').value, 10);

  let valido = true;
  const erro = (id, msg) => {
    document.getElementById(id).classList.add('is-invalid');
    document.getElementById(`erro-${id}`).textContent = msg;
    valido = false;
  };

  if (!valorImovel || valorImovel <= 0)             erro('valorImovel', 'Informe um valor de imóvel positivo.');
  if (entrada < 0)                                   erro('entrada', 'A entrada não pode ser negativa.');
  else if (valido && entrada >= valorImovel)         erro('entrada', 'A entrada deve ser menor que o valor do imóvel.');
  if (!taxaJuros || taxaJuros <= 0)                 erro('taxaJuros', 'Informe uma taxa de juros positiva.');
  if (!prazo || prazo < 1 || !Number.isInteger(prazo)) erro('prazo', 'Informe um prazo válido (mínimo 1 mês).');

  const valorFinanciado = valorImovel - entrada;

  return valido
    ? { valido: true, data: { valorFinanciado, entrada, taxaJuros, prazo } }
    : { valido: false };
}

// ─── Renderização ─────────────────────────────────────────────────────────────

function renderizarComparativo({ base, comAmortizacao }, entrada) {
  document.getElementById('base-total-juros').textContent       = formatBRL(base.totalJuros);
  document.getElementById('base-total-pago').textContent        = formatBRL(base.totalPago);
  document.getElementById('base-prazo').textContent             = `${base.prazoEfetivo} meses`;
  document.getElementById('base-total-com-entrada').textContent = formatBRL(base.totalPago + entrada);

  document.getElementById('amort-total-juros').textContent       = formatBRL(comAmortizacao.totalJuros);
  document.getElementById('amort-total-pago').textContent        = formatBRL(comAmortizacao.totalPago);
  document.getElementById('amort-prazo').textContent             = `${comAmortizacao.prazoEfetivo} meses`;
  document.getElementById('amort-total-com-entrada').textContent = formatBRL(comAmortizacao.totalPago + entrada);

  const economia     = base.totalJuros - comAmortizacao.totalJuros;
  const mesesAntecip = base.prazoEfetivo - comAmortizacao.prazoEfetivo;

  document.getElementById('amort-economia').textContent      = formatBRL(economia);
  document.getElementById('amort-meses-antecip').textContent = `${mesesAntecip} meses`;
  document.getElementById('row-meses-antecip').classList.toggle('d-none', mesesAntecip <= 0);
}

function renderizarTabela({ comAmortizacao }) {
  const fragment = document.createDocumentFragment();

  comAmortizacao.parcelas.forEach(({ mes, saldoInicial, amortizacao, amortExtra, juros, parcela, saldoFinal }) => {
    const tr = document.createElement('tr');
    if (amortExtra > 0) tr.classList.add('row-amort-extra');

    tr.innerHTML = `
      <td class="text-center">${mes}</td>
      <td class="text-end">${formatBRL(saldoInicial)}</td>
      <td class="text-end">${formatBRL(amortizacao)}</td>
      <td class="text-end${amortExtra > 0 ? ' fw-semibold text-success' : ''}">
        ${amortExtra > 0 ? formatBRL(amortExtra) : '—'}
      </td>
      <td class="text-end">${formatBRL(juros)}</td>
      <td class="text-end">${formatBRL(parcela)}</td>
      <td class="text-end">${formatBRL(saldoFinal)}</td>
    `;
    fragment.appendChild(tr);
  });

  const tbody = document.getElementById('resultado-body');
  tbody.innerHTML = '';
  tbody.appendChild(fragment);
}

function limparResultado(masks) {
  document.getElementById('resultado-container').classList.add('d-none');
  document.getElementById('resultado-body').innerHTML = '';
  ['valorImovel', 'entrada', 'taxaJuros', 'prazo'].forEach((id) =>
    document.getElementById(id).classList.remove('is-invalid')
  );
  Object.values(masks).forEach((m) => { m.unmaskedValue = ''; });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  const masks = {
    valorImovel: IMask(document.getElementById('valorImovel'), MONEY_MASK),
    entrada:     IMask(document.getElementById('entrada'),     MONEY_MASK),
  };

  document.getElementById('btn-add-amort').addEventListener('click', adicionarLinhaAmortizacao);

  document.getElementById('amort-extras-lista').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-id]');
    if (!btn) return;
    const id = btn.dataset.removeId;
    amortMasks[id]?.destroy();
    delete amortMasks[id];
    document.getElementById(`amort-linha-${id}`).remove();
    atualizarEstadoVazio();
  });

  document.getElementById('form-sac').addEventListener('submit', (e) => {
    e.preventDefault();
    const { valido, data } = validar(masks);
    if (!valido) return;

    const tipoAmortizacao    = document.querySelector('input[name="tipoAmortizacao"]:checked').value;
    const amortizacoesExtras = coletarAmortizacoes();

    const resultado = calcular({
      valorFinanciado:  data.valorFinanciado,
      taxaAnualPercent: data.taxaJuros,
      prazo:            data.prazo,
      amortizacoesExtras,
      tipoAmortizacao,
    });

    renderizarComparativo(resultado, data.entrada);
    renderizarTabela(resultado);

    const container = document.getElementById('resultado-container');
    container.classList.remove('d-none');
    container.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('form-sac').addEventListener('reset', () => {
    limparResultado(masks);
    const tbody = document.getElementById('amort-extras-lista');
    tbody.querySelectorAll('tr:not(#amort-extras-vazio)').forEach((tr) => {
      const maskId = tr.querySelector('.amort-valor')?.dataset.maskId;
      if (maskId) { amortMasks[maskId]?.destroy(); delete amortMasks[maskId]; }
      tr.remove();
    });
    atualizarEstadoVazio();
  });

  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
    new bootstrap.Tooltip(el);
  });
}

document.addEventListener('DOMContentLoaded', init);
