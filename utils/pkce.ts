const CODE_VERIFIER_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const generateCodeVerifier = (length = 64): string => {
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(
    values,
    (value) => CODE_VERIFIER_CHARS[value % CODE_VERIFIER_CHARS.length],
  ).join("");
};

const base64UrlEncode = (buffer: ArrayBuffer): string => {
  const binary = Array.from(new Uint8Array(buffer), (byte) =>
    String.fromCharCode(byte),
  ).join("");
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return base64UrlEncode(digest);
};

export const createPkcePair = async (): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
};
