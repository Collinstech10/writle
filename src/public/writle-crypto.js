// =============================================
// WRITLE-CRYPTO — browser-only PIN encryption
// =============================================
// Writele is a frontend-only app: there is no server to guard access,
// so this is NOT military-grade or "unbreakable" security. A 6-digit
// PIN only has 1,000,000 possible values. What this DOES do is keep
// the message unreadable to anyone who doesn't have the PIN and the
// link — good enough to stop casual/accidental viewing, not a defense
// against a determined attacker with the link in hand.

const WritleCrypto = (function () {
  const PBKDF2_ITERATIONS = 150000;

  function randomBytes(len) {
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return arr;
  }

  function generatePin() {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return (arr[0] % 1000000).toString().padStart(6, '0');
  }

  function isValidPin(pin) {
    return /^\d{6}$/.test(pin);
  }

  function bufToBase64Url(buf) {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function base64UrlToBuf(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  async function deriveKey(pin, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(pin), { name: 'PBKDF2' }, false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypts dataObj with the given pin, embeds the (plaintext) expiry
  // timestamp alongside the ciphertext, and returns a single base64url
  // string ready to be dropped into a URL fragment.
  async function encrypt(pin, dataObj, expiresAtMs) {
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const key = await deriveKey(pin, salt);
    const enc = new TextEncoder();
    const plaintext = enc.encode(JSON.stringify(dataObj));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

    const payload = {
      v: 1,
      s: bufToBase64Url(salt),
      i: bufToBase64Url(iv),
      e: expiresAtMs,
      c: bufToBase64Url(ciphertext)
    };
    return bufToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  }

  // Parses (but does not decrypt) an encoded fragment. Throws if malformed.
  function decodePayload(encoded) {
    const json = new TextDecoder().decode(base64UrlToBuf(encoded));
    const payload = JSON.parse(json);
    if (!payload || payload.v !== 1 || !payload.s || !payload.i || !payload.c || !payload.e) {
      throw new Error('malformed-payload');
    }
    return payload;
  }

  // Attempts to decrypt a decoded payload with the given pin.
  // Throws (AES-GCM auth failure) if the pin is wrong.
  async function decrypt(pin, payload) {
    const salt = new Uint8Array(base64UrlToBuf(payload.s));
    const iv = new Uint8Array(base64UrlToBuf(payload.i));
    const ciphertext = base64UrlToBuf(payload.c);
    const key = await deriveKey(pin, salt);
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return JSON.parse(new TextDecoder().decode(plainBuf));
  }

  return { generatePin, isValidPin, encrypt, decodePayload, decrypt };
})();
