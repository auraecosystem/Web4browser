'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { assertTrustedRenderer } = require('../desktop/ipc-security.cjs');

const trustedContents = { id: 7 };
const trustedUrl = 'file:///app/desktop/index.html';

test('accepts only the trusted chrome renderer and exact local document', () => {
  assert.doesNotThrow(() => assertTrustedRenderer({
    sender: trustedContents,
    senderFrame: { url: trustedUrl },
  }, trustedContents, trustedUrl));
});

test('rejects IPC from another webContents', () => {
  assert.throws(() => assertTrustedRenderer({
    sender: { id: 8 },
    senderFrame: { url: trustedUrl },
  }, trustedContents, trustedUrl), /untrusted renderer/);
});

test('rejects IPC from a different frame or navigated document', () => {
  for (const url of [
    'https://attacker.example/',
    'file:///app/desktop/other.html',
    undefined,
  ]) {
    assert.throws(() => assertTrustedRenderer({
      sender: trustedContents,
      senderFrame: { url },
    }, trustedContents, trustedUrl), /untrusted frame/);
  }
});

test('rejects missing or destroyed frame metadata', () => {
  assert.throws(() => assertTrustedRenderer({
    sender: trustedContents,
    senderFrame: null,
  }, trustedContents, trustedUrl), /untrusted frame/);
});
