// GitHub App authentication, step one: a short-lived RS256 JWT signed with the
// app's private key, which is then exchanged for an installation token.
//
// Kept free of Worker bindings so it can be exercised in Node against a
// throwaway key (see jwt.test.ts) - the signing path is the part most likely to
// be subtly wrong, and the least pleasant to debug through a deploy.

const encoder = new TextEncoder();

const b64url = (bytes: ArrayBuffer | Uint8Array) => {
	const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	let binary = '';
	for (const byte of view) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const b64urlJson = (value: unknown) => b64url(encoder.encode(JSON.stringify(value)));

const base64ToBytes = (b64: string) =>
	Uint8Array.from(atob(b64), (char) => char.charCodeAt(0));

/**
 * Turns the base64-of-PEM env var into the DER bytes WebCrypto wants.
 *
 * GitHub hands out PKCS#1 ("BEGIN RSA PRIVATE KEY"), which WebCrypto cannot
 * import at all - so that case fails loudly with the fix rather than throwing
 * an opaque DataError from importKey.
 */
export function privateKeyDer(base64Pem: string): ArrayBuffer {
	let pem: string;
	try {
		pem = atob(base64Pem.trim());
	} catch {
		throw new Error('GITHUB_APP_PRIVATE_KEY is not valid base64');
	}

	if (pem.includes('BEGIN RSA PRIVATE KEY')) {
		throw new Error(
			'GITHUB_APP_PRIVATE_KEY is PKCS#1, which WebCrypto cannot import. Convert it:\n' +
				'  openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in key.pem | base64 -w0',
		);
	}
	if (!pem.includes('BEGIN PRIVATE KEY')) {
		throw new Error('GITHUB_APP_PRIVATE_KEY does not decode to a PEM private key');
	}
	if (!pem.includes('END PRIVATE KEY')) {
		throw new Error('GITHUB_APP_PRIVATE_KEY is truncated - no END line. Re-copy the whole key.');
	}

	const body = pem
		.replace(/-----BEGIN PRIVATE KEY-----/, '')
		.replace(/-----END PRIVATE KEY-----/, '')
		.replace(/\s+/g, '');

	return base64ToBytes(body).buffer as ArrayBuffer;
}

export async function importSigningKey(base64Pem: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		'pkcs8',
		privateKeyDer(base64Pem),
		{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
		false,
		['sign'],
	);
}

/**
 * `iss` accepts the App ID or the Client ID; GitHub recommends the Client ID.
 * `iat` is backdated 60s for clock drift and `exp` kept under GitHub's 10
 * minute ceiling, both per GitHub's own guidance.
 */
export async function buildAppJwt(
	base64Pem: string,
	issuer: string,
	now = Date.now(),
): Promise<string> {
	const issuedAt = Math.floor(now / 1000) - 60;
	const signingInput =
		`${b64urlJson({ alg: 'RS256', typ: 'JWT' })}.` +
		`${b64urlJson({ iat: issuedAt, exp: issuedAt + 540, iss: issuer })}`;

	const signature = await crypto.subtle.sign(
		'RSASSA-PKCS1-v1_5',
		await importSigningKey(base64Pem),
		encoder.encode(signingInput),
	);

	return `${signingInput}.${b64url(signature)}`;
}

/** Decodes a JWT segment. Exported for the self-check. */
export function decodeSegment(segment: string): unknown {
	const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
	return JSON.parse(atob(padded + '='.repeat((4 - (padded.length % 4)) % 4)));
}
