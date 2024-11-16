export async function deriveSymmetricKey(password: string): Promise<CryptoKey> {
  const encoder: TextEncoder = new TextEncoder();
  // passwordKey is just the password encoded as a derivable key object
  const passwordKey: CryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    true,
    ["deriveKey"]
  );

  const salt: Uint8Array = encoder.encode(password);
  // symmetric key derived from password. we cannot use a random salt because, on login, when we send the symmetric key derived from the password,
  // if the salt generated to encrypt the user data on db was random, i would need to ask for it to the server. but in order to do so,
  // id need to send the user data encrypted with a symmetric key that would have a different salt and therefore it wouldnt match with whats on the db
  const symmetricKey: CryptoKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      // (in the future if we wanna decrypt info we will need just the password
      // and the salt to derive the same key)
      salt: salt,
      iterations: 100,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  return symmetricKey;
}

export async function encryptWithSymmetricKey(key: CryptoKey, data: string): Promise<string> {
  // this function is to encrypt using the symmetric key
  // unique initialization vector so that the same data encrypted with the same key will have different
  // encrypted representations (the IV cannot be encrypted because it is needed to decrypt the data itself)
  const iv: Uint8Array = crypto.getRandomValues(new Uint8Array(16));
  iv.fill(0);
  const encoder: TextEncoder = new TextEncoder();
  const encryptedData: ArrayBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    encoder.encode(data)
  );

  // combine the iv and encrypted data so that in the future we can decrypt them
  const combined: Uint8Array = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return btoa(String.fromCharCode(...combined));
}

// Convierte la clave pública PEM en un formato que pueda ser usado en la API Web Crypto
export async function importKey(base64Key: string, formatStr: string): Promise<CryptoKey> {

  // Decodificamos el Base64 a binario
  const binaryDer: string = atob(base64Key);
  const arrayBuffer: ArrayBuffer = new ArrayBuffer(binaryDer.length);
  const view: Uint8Array = new Uint8Array(arrayBuffer);

  // Convertimos el binario a bytes
  for (let i = 0; i < binaryDer.length; i++) {
    view[i] = binaryDer.charCodeAt(i);
  }

  const format: "spki" | "pkcs8" | "raw" = formatStr as "spki" | "pkcs8" | "raw";

  // spki is for public keys, raw is for symmetric keys
  let algorithm: RsaHashedImportParams | AesKeyAlgorithm = { name: "RSA-OAEP", hash: { name: "SHA-256" } };
  if (format === "raw") {
    algorithm = { name: "AES-GCM", length: 256 }; // Para claves simétricas
  }
  // Importamos la clave pública en formato SPKI
  return crypto.subtle.importKey(
    format,
    arrayBuffer,
    algorithm,
    true,
    ["encrypt"]
  );
}

// Encripta la clave simétrica usando la clave pública RSA
export async function encryptWithPublicKey(publicKey: CryptoKey, symmetricKey: CryptoKey): Promise<string> {
  // Convertimos la clave simétrica a ArrayBuffer (su valor en bruto)
  const symmetricKeyBuffer: ArrayBuffer = await crypto.subtle.exportKey("raw", symmetricKey);
  // Encriptamos la clave simétrica con la clave pública usando RSA-OAEP
  const encryptedSymmetricKey: ArrayBuffer = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP"
    },
    publicKey, // Usamos la clave pública
    symmetricKeyBuffer // La clave simétrica en bruto
  );
  // Convertimos el ArrayBuffer resultante en un string (y luego a Base64 pq es lo que espera el formato PEM de la priv)
  return btoa(String.fromCharCode(...new Uint8Array(encryptedSymmetricKey)));
}

export async function decryptWithSymmetricKey(symmetricKey: CryptoKey, data: string): Promise<string> {
  // Decodificar el string de entrada a un ArrayBuffer
  const decoder: TextDecoder = new TextDecoder();
  const binaryStr: string = atob(data);
  const combined: Uint8Array = new Uint8Array(binaryStr.length);
  // Convertir el string a un ArrayBuffer (manejando cada caracter del string)
  for (let i = 0; i < binaryStr.length; i++) {
    combined[i] = binaryStr.charCodeAt(i);
  }
  // Obtener el IV (primeros 16 bytes)
  const iv: Uint8Array = combined.slice(0, 16); // 16 bytes para AES-GCM
  // Obtener los datos encriptados (parte central del combinado)
  const cipherText: Uint8Array = combined.slice(16, -16);
  // Obtener el tag de autenticación (últimos 16 bytes)
  const tag: Uint8Array = combined.slice(-16); // El tag de autenticación

  const encryptedContent: Uint8Array = new Uint8Array(cipherText.length + tag.length);
  encryptedContent.set(cipherText);
  encryptedContent.set(tag, cipherText.length);
  // Desencriptar los datos con AES-GCM
  const decryptedData: ArrayBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128 // El tag es de 128 bits (16 bytes)
    },
    symmetricKey,
    encryptedContent
  );

  // Convertir el ArrayBuffer desencriptado de nuevo a un string
  return decoder.decode(decryptedData);
}

export async function storeKey(key: CryptoKey, name: string, formatStr: string): Promise<void> {
  const format: "spki" | "pkcs8" | "raw" = formatStr as "spki" | "pkcs8" | "raw";
  const keyBuffer: ArrayBuffer = await crypto.subtle.exportKey(format, key);
  const base64Key: string = btoa(String.fromCharCode(...new Uint8Array(keyBuffer)));
  localStorage.setItem(name, base64Key);
}

export async function retrieveKey(name: string, formatStr: string): Promise<CryptoKey> {
  const base64Key: string = localStorage.getItem(name);
  const binaryStr: string = atob(base64Key);
  const keyData: Uint8Array = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    keyData[i] = binaryStr.charCodeAt(i);
  }
  const format: "spki" | "pkcs8" | "raw" = formatStr as "spki" | "pkcs8" | "raw";
  // spki is for public keys, raw is for symmetric keys
  let algorithm: RsaHashedImportParams | AesKeyAlgorithm = { name: "RSA-OAEP", hash: { name: "SHA-256" } };
  if (format === "raw") {
    algorithm = { name: "AES-GCM", length: 256 }; // Para claves simétricas
  }

  return crypto.subtle.importKey(
    format,
    keyData.buffer,
    algorithm,
    true,
    format === "spki" ? ["encrypt"] : ["encrypt", "decrypt"]
  );
}
