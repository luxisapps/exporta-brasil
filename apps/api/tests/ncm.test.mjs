import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNcmCatalog, searchNcms } from '../dist/ncm.js';
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
