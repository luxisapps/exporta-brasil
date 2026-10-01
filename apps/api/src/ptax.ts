type Quote = { cotacaoCompra: number; cotacaoVenda: number; dataHoraCotacao: string; tipoBoletim?: string };
/** BRL per currency, with a bounded lookback for weekends and Brazilian holidays. */
export async function getPtaxQuote(currency: "USD") {
  const now = new Date();
  const end = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const start = new Date(`${end}T12:00:00-03:00`); start.setUTCDate(start.getUTCDate() - 10);
  const apiDate = (value: string) => `${value.slice(5, 7)}-${value.slice(8, 10)}-${value.slice(0, 4)}`;
  const params = new URLSearchParams({ "@moeda": `'${currency}'`, "@dataInicial": `'${apiDate(start.toISOString().slice(0, 10))}'`, "@dataFinalCotacao": `'${apiDate(end)}'`, "$format": "json" });
  const response = await fetch(`https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?${params}`, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`PTAX ${currency} indisponível.`);
  const payload = await response.json() as { value?: Quote[] };
  const quotes = (payload.value ?? []).filter((quote) => Number.isFinite(quote.cotacaoVenda) && quote.cotacaoVenda > 0).sort((a, b) => b.dataHoraCotacao.localeCompare(a.dataHoraCotacao));
  const quote = quotes.find((entry) => entry.tipoBoletim === "Fechamento") ?? quotes[0];
  if (!quote) throw new Error(`Sem cotação recente para ${currency}.`);
  return { buy: quote.cotacaoCompra, sell: quote.cotacaoVenda, quotedAt: `${quote.dataHoraCotacao.replace(" ", "T")}-03:00`, source: "BCB PTAX" as const };
}

/** CNY is published in the BCB all-currency CSV, outside the ten-currency OData catalogue. */
export async function getPtaxYuan(quotedAt: string) {
  const day = quotedAt.slice(0, 10);
  const response = await fetch(`https://www4.bcb.gov.br/Download/fechamento/${day.replaceAll("-", "")}.csv`, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error("PTAX CNY indisponível.");
  return parsePtaxYuan(await response.text(), day);
}
export function parsePtaxYuan(csv: string, day: string) {
  const row = csv.split(/\r?\n/).map((line) => line.split(";")).find((cells) => cells[1] === "795" && cells[3] === "CNY");
  const number = (value?: string) => Number(value?.replace(",", "."));
  const buy = number(row?.[4]), sell = number(row?.[5]);
  const expectedDate = `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;
  if (!row || row[0] !== expectedDate || !Number.isFinite(buy) || !Number.isFinite(sell) || buy <= 0 || sell <= 0) throw new Error("Cotação CNY inválida no fechamento BCB.");
  return { buy, sell, quotedAt: `${day}T13:00:00-03:00`, source: "BCB PTAX" as const };
}

