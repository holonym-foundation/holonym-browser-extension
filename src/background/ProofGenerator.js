import { ethers } from "ethers";
import { blake2s } from "blakejs";
import { Buffer } from "buffer/";
import { initialize } from "zokrates-js";

/**
 * Takes strings, properly formats them (according to spec), and returns a hash.
 * See: https://opsci.gitbook.io/untitled/4alwUHFeMIUzhQ8BnUBD/extras/leaves
 * @param {string} issuer Blockchain address of account that issued the credentials
 * @param {string} creds Credentials (e.g., "Alice" or "US")
 * @param {string} secret Hex string representation of 16 bytes
 */
export function generateSmallCredsLeaf(issuer, creds, secret) {
  const arrayifiedAddr = ethers.utils.arrayify(issuer);
  const arrayifiedSecret = ethers.utils.arrayify(Buffer.from(secret, "hex"));
  const arrayifiedCreds = ethers.utils.arrayify(
    Buffer.concat([Buffer.from(creds || "")], 28)
  );
  const msg = Uint8Array.from([
    ...arrayifiedAddr,
    ...arrayifiedCreds,
    ...arrayifiedSecret,
  ]);
  return blake2s(msg);
}

class ProofGenerator {
  /**
   * Notes
   * ------------------------------------------------------------------------------------------
   * What proofs do we need?
   * It seems like we need:
   * 1. A proof that leaf contains issuer's address
   * 2. A proof that newLeaf contains same issuer and creds as oldLeaf (maybe?)
   * 3. A proof that creds == x (where x is a numeric representation of the string "US")
   *
   * ------------------------------------------------------------------------------------------
   *
   * Generate a Proof of Residence.
   * @param {*} message
   */
  generateUnitedStatesPoR(creds, secret) {
    // createLeaf(issuer, creds, secret)
    // onAddCredentialSmall(signedLeaf, newLeaf, address, creds, oldSecret, newSecret)
    // assertLeafContainsCreds(leaf, issuer, creds, msgSender, nullifier)
    // ---------------
    // Hub must be presented with:
    // - oldLeaf
    // - server signature of oldLeaf
    // - newLeaf
    // - addLeafSmall proof (args: oldLeaf, newLeaf, address, creds, oldNullifier, newNullifier)
    // - addLeafBig
    // Need proof from addLeafSmall.zok
    // Need to run a relayer for this
  }
}

export { ProofGenerator, generateSmallCredsLeaf };
