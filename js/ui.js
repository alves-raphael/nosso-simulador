'use strict';

const UI = (() => {
  const formatBRL = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);

  const formatReajuste = (fator) => {
    const pct = (fator - 1) * 100;
    return '+' + pct.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
  };

  function validar() {
    const ids = ['valorImovel', 'taxaAdm', 'meses', 'reajuste'];
    ids.forEach((id) => {
      document.getElementById(id).classList.remove('is-invalid');
      document.getElementById(`erro-${id}`).textContent = '';
    });

    const valorImovel = parseFloat(document.getElementById('valorImovel').value);
    const taxaAdm     = parseFloat(document.getElementById('taxaAdm').value);
    const meses       = parseInt(document.getElementById('meses').value, 10);
    const reajuste    = parseFloat(document.getElementById('reajuste').value);

    let valido = true;

    const erro = (id, msg) => {
      document.getElementById(id).classList.add('is-invalid');
      document.getElementById(`erro-${id}`).textContent = msg;
      valido = false;
    };

    if (!valorImovel || valorImovel <= 0)
      erro('valorImovel', 'Informe um valor do imóvel positivo.');

    if (!taxaAdm || taxaAdm <= 0)
      erro('taxaAdm', 'Informe uma taxa de administração positiva.');

    if (!meses || meses < 1 || !Number.isInteger(meses))
      erro('meses', 'Informe um número de meses válido (mínimo 1).');

    if (isNaN(reajuste) || reajuste < 0)
      erro('reajuste', 'Informe um reajuste anual válido (mínimo 0%).');

    return valido ? { valido: true, data: { valorImovel, taxaAdm, meses, reajuste } } : { valido: false };
  }

  function renderizarResumo(resultado) {
    document.getElementById('resumo-taxaAdm').textContent   = formatBRL(resultado.taxaAdmTotal);
    document.getElementById('resumo-totalBruto').textContent = formatBRL(resultado.totalBruto);
    document.getElementById('resumo-quotaBase').textContent  = formatBRL(resultado.quotaBase);
    document.getElementById('resumo-totalPago').textContent  = formatBRL(resultado.totalPago);
  }

  function renderizarTabela(resultado) {
    const fragment = document.createDocumentFragment();

    resultado.parcelas.forEach(({ mes, fatorReajuste, parcela, totalAcumulado }) => {
      const tr = document.createElement('tr');

      if (mes > 1 && (mes - 1) % 12 === 0) {
        tr.classList.add('row-ano-novo');
      }

      tr.innerHTML = `
        <td class="text-center">${mes}</td>
        <td class="text-center">${formatReajuste(fatorReajuste)}</td>
        <td class="text-end">${formatBRL(parcela)}</td>
        <td class="text-end">${formatBRL(totalAcumulado)}</td>
      `;
      fragment.appendChild(tr);
    });

    const tbody = document.getElementById('resultado-body');
    tbody.innerHTML = '';
    tbody.appendChild(fragment);

    document.getElementById('total-pago').textContent = formatBRL(resultado.totalPago);

    renderizarResumo(resultado);

    const container = document.getElementById('resultado-container');
    container.classList.remove('d-none');
    container.scrollIntoView({ behavior: 'smooth' });
  }

  function limparResultado() {
    document.getElementById('resultado-container').classList.add('d-none');
    document.getElementById('resultado-body').innerHTML = '';
    ['valorImovel', 'taxaAdm', 'meses', 'reajuste'].forEach((id) => {
      document.getElementById(id).classList.remove('is-invalid');
    });
  }

  function init() {
    document.getElementById('form-simulador').addEventListener('submit', (e) => {
      e.preventDefault();
      const { valido, data } = validar();
      if (!valido) return;
      renderizarTabela(Calculator.calcular(data));
    });

    document.getElementById('form-simulador').addEventListener('reset', limparResultado);
  }

  document.addEventListener('DOMContentLoaded', init);

  return { init };
})();
