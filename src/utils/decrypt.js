import * as crypto from "crypto";

/*
 *    http://idpf.org/epub/20/spec/FontManglingSpec.html
 */
export function deobfuscateIdpfFont(identifier, arrayBuffer) {
    const buffer = Buffer(arrayBuffer);
    const hash = crypto.createHash("sha1");
    hash.update(identifier.replace(/\s/g, ""));
    const key = hash.digest();
    const length = 1040;
    const obfuscatedBytes = buffer.slice(0, length);

    for (let i = 0; i < length; i++) {
        obfuscatedBytes[i] = obfuscatedBytes[i] ^ (key[i % key.length]);
    }

    const remainingBytes = buffer.slice(length);

    return Buffer.concat([Buffer(obfuscatedBytes), Buffer(remainingBytes)]);
}
