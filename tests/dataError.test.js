import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dataError } from '../src/lib/dataError.js';

test('missing table errors explain setup, while unrelated errors do not suggest rerunning SQL', () => {
  for (const code of ['PGRST205', '42P01']) {
    assert.match(dataError({ code }), /Chưa tìm thấy bảng/);
    assert.match(dataError({ code }), /đúng dự án/);
  }
  assert.match(dataError({ code: 'PGRST204' }), /các cột/);
  assert.doesNotMatch(dataError({ code: 'unknown' }), /schema.sql/);
  assert.match(dataError({ message: 'Failed to fetch' }), /kiểm tra mạng/);
});
