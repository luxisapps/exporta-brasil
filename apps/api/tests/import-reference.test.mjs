import test from 'node:test';
import assert from 'node:assert/strict';
import { nextImportReference } from '@exporta/domain';

test('references start at 001 for each year', () => {
  assert.equal(nextImportReference([], 2026), 'EB-2026-001');
  assert.equal(nextImportReference([{ reference: 'EB-2025-099' }], 2026), 'EB-2026-001');
});
test('follows highest reference rather than count, including gaps and mixed years', () => {
  const operations = [{ reference: 'EB-2026-001' }, { reference: 'EB-2026-010' }, { reference: 'EB-2025-999' }];
  assert.equal(nextImportReference(operations, 2026), 'EB-2026-011');
});
test('supports more than 999 imports and ignores invalid legacy references', () => {
  assert.equal(nextImportReference([{ reference: 'EB-2026-999' }, { reference: 'CUSTOM-ABC' }, { reference: 'EB-2026-123garbage' }], 2026), 'EB-2026-1000');
});
