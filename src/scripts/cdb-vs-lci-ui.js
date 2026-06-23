'use strict';

import IMask from 'imask';
import { calcular } from './cdb-vs-lci-calculator.js';

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

const formatBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(v);

const formatPct = (v, casas = 2) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v) + '%';

const el = (id) => document.getElementById(id);

// ─── Validação ───────────────────────────────────────────────────────────────

function validar(masks) {
  ['valorInicial', 'prazo', 'cdiAnual', 'percentualCDB', 'percentualLCI'].forEach((id) => {
    el(id).classList.remove('is-invalid');
    el(`erro-${id}`).textContent = '';
  });

  const valorInicial  = masks.valorInicial.typedValue  || 0;
  const cdiAnual      = masks.cdiAnual.typedValue      ?? NaN;
  const percentualCDB = masks.percentualCDB.typedValue ?? NaN;
  const percentualLCI = masks.percentualLCI.typedValue ?? NaN;
  const prazo         = parseInt(el('prazo').value, 10);

  let valido = true;
  const erro = (id, msg) => {
    el(id).classList.add('is-invalid');
    el(`erro-${id}`).textContent = msg;
    valido = false;
  };

  if (!valorInicial || valorInicial <= 0)               erro('valorInicial', 'Informe um valor inicial positivo.');
  if (!prazo || prazo < 1 || !Number.isInteger(prazo))  erro('prazo', 'Informe um prazo válido em meses (mínimo 1).');
  if (isNaN(cdiAnual) || cdiAnual <= 0)                 erro('cdiAnual', 'Informe a taxa CDI anual positiva.');
  if (isNaN(percentualCDB) || percentualCDB <= 0)       erro('percentualCDB', 'Informe o percentual do CDI para o CDB.');
  if (isNaN(percentualLCI) || percentualLCI <= 0)       erro('percentualLCI', 'Informe o percentual do CDI para a LCI.');

  return valido
    ? { valido: true, data: { valorInicial, meses: prazo, cdiAnual, percentualCDB, percentualLCI } }
    : { valido: false };
}

// ─── Renderização ────────────────────────────────────────────────────────────

function renderizar({ cdb, lci, melhor, diferenca, lciEquivalente }) {
  // CDB
  el('cdb-rend-bruto').textContent     = formatBRL(cdb.rendimentoBruto);
  el('cdb-aliquota-label').textContent = `IR (${formatPct(cdb.aliquota * 100, 1)})`;
  el('cdb-ir').textContent             = `− ${formatBRL(cdb.ir)}`;
  el('cdb-rend-liquido').textContent   = formatBRL(cdb.rendimentoLiquido);
  el('cdb-valor-final').textContent    = formatBRL(cdb.valorFinal);
  el('cdb-rentabilidade').textContent  = formatPct(cdb.rentabilidadeLiquida);

  // LCI
  el('lci-rend-bruto').textContent    = formatBRL(lci.rendimentoBruto);
  el('lci-rend-liquido').textContent  = formatBRL(lci.rendimentoLiquido);
  el('lci-valor-final').textContent   = formatBRL(lci.valorFinal);
  el('lci-rentabilidade').textContent = formatPct(lci.rentabilidadeLiquida);

  // Destaque do vencedor
  const cardCDB = el('card-cdb');
  const cardLCI = el('card-lci');
  cardCDB.classList.remove('border-primary', 'border-success', 'border-2');
  cardLCI.classList.remove('border-primary', 'border-success', 'border-2');
  (melhor === 'CDB' ? cardCDB : cardLCI).classList.add(
    melhor === 'CDB' ? 'border-primary' : 'border-success',
    'border-2'
  );

  // Alerta vencedor
  const alerta = el('resultado-melhor');
  alerta.className = `alert ${melhor === 'CDB' ? 'alert-primary' : 'alert-success'}`;
  alerta.innerHTML = diferenca === 0
    ? 'CDB e LCI rendem o mesmo valor líquido neste período.'
    : `<strong>${melhor}</strong> rende <strong>${formatBRL(diferenca)}</strong> a mais no período.`;

  // LCI equivalente
  el('lci-equivalente').textContent = `${formatPct(lciEquivalente, 2)} do CDI`;

  const container = el('resultado-container');
  container.classList.remove('d-none');
  container.scrollIntoView({ behavior: 'smooth' });
}

function limpar(masks) {
  el('resultado-container').classList.add('d-none');
  ['valorInicial', 'prazo', 'cdiAnual', 'percentualCDB', 'percentualLCI'].forEach((id) =>
    el(id).classList.remove('is-invalid')
  );
  Object.values(masks).forEach((m) => { m.unmaskedValue = ''; });
}

// ─── Init ────────────────────────────────────────────────────────────────────

function init() {
  const masks = {
    valorInicial:  IMask(el('valorInicial'),  MONEY_MASK),
    cdiAnual:      IMask(el('cdiAnual'),      PERCENT_MASK),
    percentualCDB: IMask(el('percentualCDB'), PERCENT_MASK),
    percentualLCI: IMask(el('percentualLCI'), PERCENT_MASK),
  };

  el('form-cdb-lci').addEventListener('submit', (e) => {
    e.preventDefault();
    const { valido, data } = validar(masks);
    if (!valido) return;
    renderizar(calcular(data));
  });

  el('form-cdb-lci').addEventListener('reset', () => limpar(masks));
}

document.addEventListener('DOMContentLoaded', init);
