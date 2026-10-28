'use strict';
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
function normalizeNavigation(input) {
  if (typeof input !== 'string') throw new TypeError('Address must be text.');
  const value = input.trim();
  if (!value || value.length > 4096) throw new Error('Enter a valid web address.');
  if (/^(javascript|data|file|vbscript|about):/i.test(value)) throw new Error('This address scheme is not allowed.');
  let candidate = value;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate)) { if (/\s/.test(candidate) || !candidate.includes('.')) return 'https://duckduckgo.com/?q=' + encodeURIComponent(candidate); candidate = 'https://' + candidate; }
  let parsed;
  try { parsed = new URL(candidate); } catch { throw new Error('Enter a valid web address.'); }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) throw new Error('Only HTTP and HTTPS pages are allowed.');
  if (!parsed.hostname || parsed.username || parsed.password) throw new Error('Address must include a host and must not contain credentials.');
  return parsed.href;
}
function isSafeExternalUrl(value) { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; } }
module.exports = { normalizeNavigation, isSafeExternalUrl };
