import { Buffer } from "buffer/";
import { ethers } from "ethers";
import blake from "blakejs";
import { stateAbbreviations, maxEncryptableLength } from "./constants";

export function generateSecret(numBytes = 16) {
  const array = new Uint8Array(numBytes);
  return "0x" + Buffer.from(crypto.getRandomValues(array)).toString("hex");
}

export function toU32StringArray(bytes) {
  let u32s = chunk(bytes.toString("hex"), 8);
  return u32s.map((x) => parseInt(x, 16).toString());
}
export function chunk(arr, chunkSize) {
  let out = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    out.push(chunk);
  }
  return out;
}

export function getStateAsBytes(state) {
  if (!state) {
    return Buffer.concat([Buffer.from("")], 2);
  }
  state = stateAbbreviations[state.toUpperCase()];
  return Buffer.concat([Buffer.from(state || "")], 2);
}

/**
 * Convert date string to 3 bytes with the following structure:
 * byte 1: number of years since 1900
 * bytes 2-3: number of days since beginning of the year
 * @param {string} date Must be of form yyyy-mm-dd
 */
export function getDateAsBytes(date) {
  const [year, month, day] = date.split("-");
  const yearsSince1900 = parseInt(year) - 1900;
  const daysSinceNewYear = getDaysSinceNewYear(parseInt(month), parseInt(day));

  // Convert yearsSince1900 and daysSinceNewYear to bytes
  const yearsBuffer = Buffer.alloc(1, yearsSince1900);
  let daysBuffer;
  if (daysSinceNewYear > 255) {
    daysBuffer = Buffer.concat([
      Buffer.from([0x01]),
      Buffer.alloc(1, daysSinceNewYear - 256),
    ]);
  } else {
    daysBuffer = Buffer.alloc(1, daysSinceNewYear);
  }

  return Buffer.concat([yearsBuffer, daysBuffer], 3);
}

function getDaysSinceNewYear(month, day) {
  let daysSinceNewYear = day;
  if (month == 1) {
    return daysSinceNewYear;
  }
  if (month > 1) {
    daysSinceNewYear += 31;
  }
  if (month > 2) {
    if (isLeapYear(new Date().getYear())) {
      daysSinceNewYear += 29;
    } else {
      daysSinceNewYear += 28;
    }
  }
  if (month > 3) {
    daysSinceNewYear += 31;
  }
  if (month > 4) {
    daysSinceNewYear += 30;
  }
  if (month > 5) {
    daysSinceNewYear += 31;
  }
  if (month > 6) {
    daysSinceNewYear += 30;
  }
  if (month > 7) {
    daysSinceNewYear += 31;
  }
  if (month > 8) {
    daysSinceNewYear += 31;
  }
  if (month > 9) {
    daysSinceNewYear += 30;
  }
  if (month > 10) {
    daysSinceNewYear += 31;
  }
  if (month > 11) {
    daysSinceNewYear += 30;
  }
  return daysSinceNewYear;
}

function isLeapYear(year) {
  return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));

const serverPublicKey = {
  key_ops: ["encrypt"],
  ext: true,
  kty: "RSA",
  n: "wZQBp5vWiFTU9ORIzlySpULJQB7XuZIZ46CH3DKweg-eukKfU1YGX8H_aNLFzDThSR_Gv7xnZ2AfoN_-EAqrLGf0T310j-FfAbe5JUMvxrH02Zk5LhZw5tu5n4XEJRHIAqJPUy_0vFS4-zfmGLIDpDgidRFh8eg_ghTEkOWybe99cg2qo_sa1m-ANr5j4qzpUFnOjZwvaWyhmBdlu7gtOC15BRwBP97Rp0bNeGEulEpoxPtks8XjgWXJ4MM7L8m2SkyHOTKGrrTXmAStvlbolWnq27S1QqTznMec4s2r9pUpfNwQGbbi7xTruTic-_zuvcvYqJwx-mpG7EQrwNIFK2KvM1PogezS6_2zYRy2uQTqpsLTEsaP-o-J4cylWQ3fikGh2EShzVKhgr1DWOy2Bmv9pZq5C7R_5OpApfwvTt3lFAWFjOez0ggHM9UbuKuUNay_D4bTEOaupBzDbkrn1hymgFuQtO97Wh6bFQKTHqpFiEy-LbPkoTKq6K0wNzsTne8-laBOPpYzTgtV9V_XFnR7EjsAYOaqLYU2pnr8UrhcMqsY1AIQDWvKqKMzDo25g6wQFtYnKQ8xEnVC1pT2P4Dt3Fx4Y6Uzg866rifn7MRpZBfXc5vsOnN46rSQLksWJrt8noxEbBGzi7Qi67O9EE9gWYSW2vWp3N6v81Isx9k",
  e: "AQAB",
  alg: "RSA-OAEP-256",
};
export async function encryptForServer(message) {
  async function encryptShard(message) {
    const algo = {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    };
    let args = ["jwk", serverPublicKey, algo, false, ["encrypt"]];
    const pubKeyAsCryptoKey = await crypto.subtle.importKey(...args);
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);
    args = ["RSA-OAEP", pubKeyAsCryptoKey, encodedMessage];
    const encryptedMessage = await crypto.subtle.encrypt(...args);
    return JSON.stringify(Array.from(new Uint8Array(encryptedMessage)));
  }

  const usingSharding = message.length > maxEncryptableLength;
  let encryptedMessage; // array<string> if sharding, string if not sharding
  if (usingSharding) {
    encryptedMessage = [];
    for (let i = 0; i < message.length; i += maxEncryptableLength) {
      const shard = message.substring(i, i + maxEncryptableLength);
      const encryptedShard = await encryptShard(shard);
      encryptedMessage.push(encryptedShard);
    }
  } else {
    encryptedMessage = await encryptShard(message);
  }
  return { encryptedMessage: encryptedMessage, sharded: usingSharding };
}

function assertLengthIs(item, length, itemName) {
  if (item.length != length) {
    throw new Error(`${itemName} has length ${item.length}, not ${length}`);
  }
}
/**
 * Takes Buffer, properly formats them (according to spec), and returns a hash.
 * See: https://opsci.gitbook.io/untitled/4alwUHFeMIUzhQ8BnUBD/extras/leaves
 * @param {Buffer} issuer Blockchain address of account that issued the credentials
 * @param {Buffer} creds Credentials (e.g., "Alice" or 2 as Buffer)
 * @param {Buffer} secret Hex string representation of 16 bytes
 * @returns {Promise<string>} Blake2s hash (of input data) right-shifted 3 bits. Base 10 number
 * represented as a string.
 */
export async function createSmallLeaf(issuer, creds, secret) {
  assertLengthIs(issuer, 20, "issuer");
  assertLengthIs(creds, 28, "creds");
  assertLengthIs(secret, 16, "secret");
  try {
    const arrayifiedIssuer = ethers.utils.arrayify(issuer);
    const arrayifiedCreds = ethers.utils.arrayify(creds);
    const arrayifiedSecret = ethers.utils.arrayify(secret);
    const msg = Uint8Array.from([
      ...arrayifiedIssuer,
      ...arrayifiedCreds,
      ...arrayifiedSecret,
    ]);
    const blake2Hash = blake.blake2s(msg);
    const blake2HashAsBigNum = ethers.BigNumber.from(blake2Hash);
    const shiftedHash = blake2HashAsBigNum.div(8);
    return shiftedHash.toString();
  } catch (err) {
    console.log(err);
  }
}