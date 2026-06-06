'use strict';

const SacUI = (() => {
  let linhaCount = 0;

  const formatBRL = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);

  // ─── Mini-tabela de amortizações extras ──────────────────────────────────

  function atualizarEstadoVazio() {
    const tbody  = document.getElementById('amort-extras-lista');
    const vazio  = document.getElementById('amort-extras-vazio');
    const temLinhas = tbody.querySelectorAll('tr:not(#amort-extras-vazio)').length > 0;
    vazio.classList.toggle('d-none', temLinhas);
  }

  function removerLinha(id) {
    const tr = document.getElementById(`amort-linha-${id}`);
    if (tr) tr.remove();
    atualizarEstadoVazio();
  }

  function adicionarLinhaAmortizacao() {
    linhaCount++;
    const id   = linhaCount;
    const tbody = document.getElementById('amort-extras-lista');

    const tr  = document.createElement('tr');
    tr.id     = `amort-linha-${id}`;
    tr.innerHTML = `
      <td>
        <input type="number" class="form-control form-control-sm amort-mes"
          min="1" step="1" placeholder="Ex: 12" />
      </td>
      <td>
        <input type="number" class="form-control form-control-sm amort-valor"
          min="0.01" step="0.01" placeholder="Ex: 50000" />
      </td>
      <td class="text-center align-middle">
        <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2"
          onclick="SacUI.removerLinha(${id})">✕</button>
      </td>
    `;
    tbody.appendChild(tr);
    atualizarEstadoVazio();
  }

  function coletarAmortizacoes() {
    const mapa = {};
    document.querySelectorAll('#amort-extras-lista tr:not(#amort-extras-vazio)').forEach((tr) => {
      const mes   = parseInt(tr.querySelector('.amort-mes').value, 10);
      const valor = parseFloat(tr.querySelector('.amort-valor').value);
      if (mes > 0 && valor > 0) {
        mapa[mes] = (mapa[mes] || 0) + valor;
      }
    });
    return mapa;
  }

  // ─── Validação ───────────────────────────────────────────────────────────

  function validar() {
    const ids = ['valorFinanciado', 'taxaJuros', 'prazo'];
    ids.forEach((id) => {
      document.getElementById(id).classList.remove('is-invalid');
      document.getElementById(`erro-${id}`).textContent = '';
    });

    const valorFinanciado = parseFloat(document.getElementById('valorFinanciado').value);
    const taxaJuros       = parseFloat(document.getElementById('taxaJuros').value);
    const prazo           = parseInt(document.getElementById('prazo').value, 10);

    let valido = true;
    const erro = (id, msg) => {
      document.getElementById(id).classList.add('is-invalid');
      document.getElementById(`erro-${id}`).textContent = msg;
      valido = false;
    };

    if (!valorFinanciado || valorFinanciado <= 0)
      erro('valorFinanciado', 'Informe um valor de financiamento positivo.');
    if (!taxaJuros || taxaJuros <= 0)
      erro('taxaJuros', 'Informe uma taxa de juros positiva.');
    if (!prazo || prazo < 1 || !Number.isInteger(prazo))
      erro('prazo', 'Informe um prazo válido (mínimo 1 mês).');

    return valido
      ? { valido: true, data: { valorFinanciado, taxaJuros, prazo } }
      : { valido: false };
  }

  // ─── Renderização ────────────────────────────────────────────────────────

  function renderizarComparativo({ base, comAmortizacao }) {
    document.getElementById('base-total-juros').textContent = formatBRL(base.totalJuros);
    document.getElementById('base-total-pago').textContent  = formatBRL(base.totalPago);
    document.getElementById('base-prazo').textContent       = `${base.prazoEfetivo} meses`;

    document.getElementById('amort-total-juros').textContent = formatBRL(comAmortizacao.totalJuros);
    document.getElementById('amort-total-pago').textContent  = formatBRL(comAmortizacao.totalPago);
    document.getElementById('amort-prazo').textContent       = `${comAmortizacao.prazoEfetivo} meses`;

    const economia     = base.totalJuros - comAmortizacao.totalJuros;
    const mesesAntecip = base.prazoEfetivo - comAmortizacao.prazoEfetivo;

    document.getElementById('amort-economia').textContent        = formatBRL(economia);
    document.getElementById('amort-meses-antecip').textContent   = `${mesesAntecip} meses`;
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

  function limparResultado() {
    document.getElementById('resultado-container').classList.add('d-none');
    document.getElementById('resultado-body').innerHTML = '';
    ['valorFinanciado', 'taxaJuros', 'prazo'].forEach((id) =>
      document.getElementById(id).classList.remove('is-invalid')
    );
  }

  // ─── Init ────────────────────────────────────────────────────────────────

  function init() {
    document.getElementById('btn-add-amort').addEventListener('click', adicionarLinhaAmortizacao);

    document.getElementById('form-sac').addEventListener('submit', (e) => {
      e.preventDefault();
      const { valido, data } = validar();
      if (!valido) return;

      const tipoAmortizacao    = document.querySelector('input[name="tipoAmortizacao"]:checked').value;
      const amortizacoesExtras = coletarAmortizacoes();

      const resultado = SacCalculator.calcular({
        valorFinanciado:  data.valorFinanciado,
        taxaAnualPercent: data.taxaJuros,
        prazo:            data.prazo,
        amortizacoesExtras,
        tipoAmortizacao,
      });

      renderizarComparativo(resultado);
      renderizarTabela(resultado);

      const container = document.getElementById('resultado-container');
      container.classList.remove('d-none');
      container.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('form-sac').addEventListener('reset', () => {
      limparResultado();
      const tbody = document.getElementById('amort-extras-lista');
      tbody.querySelectorAll('tr:not(#amort-extras-vazio)').forEach((tr) => tr.remove());
      atualizarEstadoVazio();
    });

    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
      new bootstrap.Tooltip(el);
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { init, removerLinha };
})();
