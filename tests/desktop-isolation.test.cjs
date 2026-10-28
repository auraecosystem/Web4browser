'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const mainSource = fs.readFileSync(path.join(root, 'desktop', 'main.cjs'), 'utf8');
const preloadSource = fs.readFileSync(path.join(root, 'desktop', 'preload.cjs'), 'utf8');
const securitySource = fs.readFileSync(path.join(root, 'desktop', 'security.cjs'), 'utf8');

test('desktop renderer isolation remains enabled', () => {
  assert.match(mainSource, /nodeIntegration:\s*false/);
  assert.match(mainSource, /contextIsolation:\s*true/);
  assert.match(mainSource, /sandbox:\s*true/);
  assert.match(mainSource, /webSecurity:\s*true/);
  assert.match(mainSource, /allowRunningInsecureContent:\s*false/);
});

test('external page popups are denied by default', () => {
  assert.match(mainSource, /setWindowOpenHandler\(\(\{\s*url\s*\}\)\s*=>/);
  assert.match(mainSource, /return\s*\{\s*action:\s*'deny'\s*\}/);
});

test('external page navigation blocks non-web protocols', () => {
  assert.match(mainSource, /will-navigate/);
  assert.match(mainSource, /\['http:',\s*'https:'\]\.includes\(new URL\(url\)\.protocol\)/);
  assert.match(securitySource, /new Set\(\['http:',\s*'https:'\]\)/);
});

test('permission requests are denied by default', () => {
  assert.match(mainSource, /setPermissionRequestHandler\([^]*?callback\(false\)/);
});

test('preload bridge exposes only named browser operations', () => {
  assert.match(preloadSource, /contextBridge\.exposeInMainWorld\('web4browser'/);
  assert.doesNotMatch(preloadSource, /exposeInMainWorld\([^]*?require\s*:/);
  assert.doesNotMatch(preloadSource, /exposeInMainWorld\([^]*?send\s*:/);
  for (const method of ['navigate', 'back', 'forward', 'reload', 'stop', 'bookmarkCurrent']) {
    assert.match(preloadSource, new RegExp('\\b' + method + '\\s*:'));
  }
});

test('the repository does not claim to implement an HTTP/3 or QPACK server', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  assert.equal(Object.keys(dependencies).some(name => /qpack|http3|quiche|aioquic/i.test(name)), false);
});
