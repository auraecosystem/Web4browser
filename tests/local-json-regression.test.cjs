'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const MAX_BODY_BYTES = 64 * 1024;
const MAX_QUERY_PARAMS = 64;
const MAX_REDIRECTS = 3;

function isLoopbackTarget(value) {
  let url;
  try { url = new URL(value); } catch { return false; }
  return (url.protocol === 'http:' || url.protocol === 'https:') &&
    ['127.0.0.1', 'localhost', '[::1]', '::1'].includes(url.hostname);
}

function buildBoundedMalformedPayload(depth = 16) {
  if (!Number.isInteger(depth) || depth < 1 || depth > 64) {
    throw new RangeError('depth must be an integer between 1 and 64');
  }
  return Buffer.from('['.repeat(depth) + '0' + ']'.repeat(depth) + ' trailing');
}

function createFixtureServer() {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }
    if (req.url === '/redirect' && req.method === 'GET') {
      res.writeHead(302, { location: '/health' });
      res.end();
      return;
    }
    if (req.url !== '/parse' || req.method !== 'POST') {
      res.writeHead(404);
      res.end('not found');
      return;
    }

    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        res.writeHead(413, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'payload_too_large' }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (res.writableEnded || req.destroyed) return;
      try {
        JSON.parse(Buffer.concat(chunks).toString('utf8'));
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ accepted: true }));
      } catch {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid_json' }));
      }
    });
  });
  return server;
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve(server.address());
    });
  });
}

function request({ port, path, method = 'GET', body }) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1', port, path, method, timeout: 2000,
      headers: body ? {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      } : {},
    }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      }));
    });
    req.on('timeout', () => req.destroy(new Error('local fixture request timed out')));
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

test('regression harness refuses non-loopback targets', () => {
  assert.equal(isLoopbackTarget('http://127.0.0.1:3000'), true);
  assert.equal(isLoopbackTarget('http://localhost:3000/test'), true);
  assert.equal(isLoopbackTarget('https://example.com'), false);
  assert.equal(isLoopbackTarget('file:///etc/passwd'), false);
});

test('payload and query settings are bounded before sending requests', () => {
  assert.equal(buildBoundedMalformedPayload(16).length < MAX_BODY_BYTES, true);
  assert.throws(() => buildBoundedMalformedPayload(0), RangeError);
  assert.throws(() => buildBoundedMalformedPayload(65), RangeError);
  assert.equal(MAX_QUERY_PARAMS, 64);
  assert.equal(MAX_REDIRECTS, 3);
});

test('malformed JSON receives a controlled 400 and server remains healthy', async t => {
  const server = createFixtureServer();
  const address = await listen(server);
  t.after(() => new Promise(resolve => server.close(resolve)));

  const bad = await request({
    port: address.port,
    path: '/parse',
    method: 'POST',
    body: buildBoundedMalformedPayload().toString('utf8'),
  });
  assert.equal(bad.status, 400);
  assert.deepEqual(JSON.parse(bad.body), { error: 'invalid_json' });

  const health = await request({ port: address.port, path: '/health' });
  assert.equal(health.status, 200);
  assert.deepEqual(JSON.parse(health.body), { status: 'ok' });
  assert.equal(server.listening, true);
});

test('redirect fixture stays on the local test server', async t => {
  const server = createFixtureServer();
  const address = await listen(server);
  t.after(() => new Promise(resolve => server.close(resolve)));

  const response = await request({ port: address.port, path: '/redirect' });
  assert.equal(response.status, 302);
  const destination = new URL(response.headers.location, 'http://127.0.0.1:' + address.port);
  assert.equal(isLoopbackTarget(destination.href), true);
  assert.equal(destination.pathname, '/health');
});
