// Run: npx tsx src/lib/github/jwt.test.ts
//
// Generates a throwaway RSA key, so the signing path is verified without the
// real app key ever being involved.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { buildAppJwt, decodeSegment, importSigningKey, privateKeyDer } from './jwt.ts';

const pkcs8Pem = execFileSync('openssl', ['genpkey', '-algorithm', 'RSA', '-pkeyopt', 'rsa_keygen_bits:2048'], { encoding: 'utf8' });
const pkcs8 = Buffer.from(pkcs8Pem).toString('base64');

// --- the failure modes that actually happen, each named precisely ---
const pkcs1Pem = execFileSync('openssl', ['rsa', '-traditional'], { input: pkcs8Pem, encoding: 'utf8' });
assert.throws(
	() => privateKeyDer(Buffer.from(pkcs1Pem).toString('base64')),
	/PKCS#1.*openssl pkcs8 -topk8/s,
	'a PKCS#1 key must say how to convert it',
);
assert.throws(
	() => privateKeyDer(Buffer.from(pkcs8Pem.slice(0, 600)).toString('base64')),
	/truncated/,
	'a truncated key must be reported as truncated, not as a crypto error',
);
assert.throws(() => privateKeyDer('not base64 at all!!'), /base64|PEM/);

// --- the happy path ---
assert.ok(privateKeyDer(pkcs8).byteLength > 1000, 'PKCS#8 decodes to DER');

const jwt = await buildAppJwt(pkcs8, 'Iv23liTESTCLIENTID', Date.parse('2026-09-02T00:00:00Z'));
const [header, payload, signature] = jwt.split('.');
assert.equal(jwt.split('.').length, 3);

assert.deepEqual(decodeSegment(header), { alg: 'RS256', typ: 'JWT' });

const claims = decodeSegment(payload) as { iat: number; exp: number; iss: string };
assert.equal(claims.iss, 'Iv23liTESTCLIENTID');
assert.equal(claims.iat, Math.floor(Date.parse('2026-09-02T00:00:00Z') / 1000) - 60, 'iat backdated 60s for clock drift');
assert.ok(claims.exp - claims.iat <= 600, 'exp must stay within GitHub 10 minute ceiling');
assert.ok(claims.exp > claims.iat, 'exp after iat');

// base64url, not base64: a `+` or `/` here silently 401s against GitHub
assert.ok(!/[+/=]/.test(jwt), 'JWT must be base64url with no padding');

// --- the signature must actually verify against the matching public key ---
const priv = await importSigningKey(pkcs8);
assert.ok(priv, 'key imports as a signing key');

const spkiPem = execFileSync('openssl', ['pkey', '-pubout'], { input: pkcs8Pem, encoding: 'utf8' });
const spkiDer = Buffer.from(spkiPem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, ''), 'base64');
const pub = await crypto.subtle.importKey('spki', spkiDer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);

const verified = await crypto.subtle.verify(
	'RSASSA-PKCS1-v1_5',
	pub,
	Buffer.from(signature.replace(/-/g, '+').replace(/_/g, '/'), 'base64'),
	new TextEncoder().encode(`${header}.${payload}`),
);
assert.ok(verified, 'signature verifies against the public key');

console.log('github jwt ok');
