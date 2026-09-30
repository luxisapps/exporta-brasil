import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNcmCatalog, searchNcms, suggestNcms } from '../dist/ncm.js';
const row = (Codigo, Descricao, Data_Fim = '31/12/9999') => ({ Codigo, Descricao, Data_Inicio: '01/01/2020', Data_Fim });
const entries = parseNcmCatalog([
  row('85', 'Máquinas elétricas'), row('85.01', 'Motores elétricos'), row('8501.10', 'Potência até 37,5 W'),
  row('8501.10.11', '-- Corrente contínua'), row('8501.10.12', '-- Outros', '31/12/2021'), row('8501.10.13', '-- Alternada')
], new Date('2026-09-30T12:00:00Z'));
test('returns only current eight-digit codes and builds contextual official descriptions', () => {
  assert.equal(entries.length, 2);
  assert.equal(entries[0].code, '85011011');
  assert.match(entries[0].fullDescription, /Motores elétricos/);
  assert.match(entries[0].fullDescription, /Corrente contínua/);
});
test('search matches accented words and formatted code prefixes', () => {
  assert.equal(searchNcms(entries, 'motores continua')[0].code, '85011011');
  assert.equal(searchNcms(entries, '8501.10.11')[0].code, '85011011');
  assert.equal(searchNcms(entries, 'motor inexistente').length, 0);
});

test('Gemini suggestions retain official descriptions and discard codes outside the catalog', async (t) => {
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  t.after(() => { if (previous === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previous; });
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body), headers: options.headers });
    const result = requests.length === 1 ? { headings: ['8501'] } : {
      suggestions: [{ code: '85011011', reason: 'Motor de corrente contínua' }, { code: '99999999', reason: 'Inválido' }], missingInformation: ['Confirme a potência nominal.']
    };
    return Response.json({ output_text: JSON.stringify(result) });
  });
  const result = await suggestNcms('Motor elétrico de corrente contínua', entries);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, 'https://generativelanguage.googleapis.com/v1beta/interactions');
  assert.equal(requests[0].headers['x-goog-api-key'], 'test-key');
  assert.equal(requests[0].body.store, false);
  assert.deepEqual(requests[1].body.response_format.schema.properties.suggestions.items.properties.code.enum, ['85011011', '85011013']);
  assert.equal(result.suggestions.length, 1);
  assert.equal(result.suggestions[0].fullDescription, entries[0].fullDescription);
  assert.equal(result.suggestions[0].taxStatus, 'not_queried');
  assert.deepEqual(result.missingInformation, ['Confirme a potência nominal.']);
});

test('rejects invalid AI structure and explains provider rate limits', async (t) => {
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  t.after(() => { if (previous === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previous; });
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ output_text: '{"headings":null}' }));
  await assert.rejects(suggestNcms('Motor elétrico', entries), /resposta inválida/);
  mock.mock.mockImplementation(async () => new Response('', { status: 429 }));
  await assert.rejects(suggestNcms('Motor elétrico', entries), /limite de uso/);
  mock.mock.mockImplementation(async () => new Response('', { status: 402 }));
  await assert.rejects(suggestNcms('Motor elétrico', entries), /créditos pré-pagos/);
});
