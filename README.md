# Nosso Simulador

Simuladores financeiros para consórcio imobiliário e financiamento SAC, com foco em clareza e facilidade de uso.

## Simuladores

### Consórcio Imobiliário (`/`)
Calcula as parcelas mensais de um consórcio com reajuste anual configurável (geralmente atrelado a índices como INCC ou IPCA). Exibe uma tabela mês a mês e permite comparar o custo total com o valor de aluguel pago no mesmo período.

**Campos:**
- Valor do imóvel
- Taxa de administração
- Prazo (meses)
- Reajuste anual (%)
- Valor do aluguel + correção anual (opcional)

### Financiamento SAC (`/sac`)
Simula um financiamento pela Tabela SAC (Sistema de Amortização Constante) e permite adicionar amortizações antecipadas para visualizar a economia em juros gerada.

**Campos:**
- Valor do imóvel e entrada (20% preenchido automaticamente)
- Taxa de juros anual
- Prazo (meses)
- Amortizações antecipadas por mês (lista dinâmica)
- Efeito da amortização: reduzir prazo ou reduzir parcela

## Stack

- HTML + CSS + JavaScript (vanilla)
- [Astro](https://astro.build/) para roteamento, build e dev server
- [Bootstrap 5.3](https://getbootstrap.com/) via CDN
- [iMask](https://imask.js.org/) para máscaras nos inputs

## Desenvolvimento

```bash
npm install
npm run dev      # servidor local com hot reload
```

## Build

```bash
npm run build    # gera dist/ com assets minificados
npm run preview  # preview do build de produção
```

O build gera os arquivos em `dist/` (`index.html` na raiz, `sac/index.html` para a rota `/sac`) com JS/CSS minificados e hash nos nomes para cache busting.
