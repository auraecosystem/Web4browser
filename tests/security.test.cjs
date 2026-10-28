'use strict';
const test = require('node:test'); const assert = require('node:assert/strict'); const { normalizeNavigation, isSafeExternalUrl } = require('../desktop/security.cjs');
test('normalizes a bare hostname to HTTPS', () => assert.equal(normalizeNavigation('example.com'), 'https://example.com/'));
test('converts a phrase into a search URL', () => assert.equal(normalizeNavigation('Web4 trust identity'), 'https://duckduckgo.com/?q=Web4%20trust%20identity'));
test('rejects active and local-file schemes', () => { for (const value of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,hello', 'vbscript:msgbox(1)']) assert.throws(() => normalizeNavigation(value)); });
test('rejects embedded credentials and invalid input', () => { assert.throws(() => normalizeNavigation('https://user:pass@example.com')); assert.throws(() => normalizeNavigation('')); assert.throws(() => normalizeNavigation('x'.repeat(4097))); });
test('external windows are limited to credential-free HTTPS URLs', () => { assert.equal(isSafeExternalUrl('https://example.com/path'), true); assert.equal(isSafeExternalUrl('http://example.com'), false); assert.equal(isSafeExternalUrl('javascript:alert(1)'), false); assert.equal(isSafeExternalUrl('https://user:pass@example.com'), false); });
