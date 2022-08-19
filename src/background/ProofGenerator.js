import { ethers } from "ethers";
import { blake2s } from "blakejs";
import { Buffer } from "buffer/";
import { initialize as initializeZokrates } from "zokrates-js";
import { generateSecret } from "./utils";
import { serverAddress } from "./constants";

/**
 * Takes strings, properly formats them (according to spec), and returns a hash.
 * See: https://opsci.gitbook.io/untitled/4alwUHFeMIUzhQ8BnUBD/extras/leaves
 * @param {string} issuer Blockchain address of account that issued the credentials
 * @param {string} creds Credentials (e.g., "Alice" or "US")
 * @param {string} secret Hex string representation of 16 bytes
 */
export function createSmallCredsLeaf(issuer, creds, secret) {
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
   * Generate a Proof of Residence.
   * @param {string} creds
   * @param {string} nullifier 16-byte hex string
   */
  async generateUnitedStatesPoR(creds, nullifier) {
    // TODO: Check server signature of leaf. Don't submit tx unless you know it will succeed.
    const signedLeaf = createSmallCredsLeaf(serverAddress, creds, nullifier);
    const newNullifier = generateSecret();
    const newLeaf = createSmallCredsLeaf(serverAddress, creds, newNullifier);

    const arrayifiedAddr = ethers.utils.arrayify(serverAddress);
    const arrayifiedNullifier = ethers.utils.arrayify(Buffer.from(nullifier, "hex"));
    const arrayifiedCreds = ethers.utils.arrayify(
      Buffer.concat([Buffer.from(creds || "")], 28)
    );
    const arrayifiedNewNullifier = ethers.utils.arrayify(
      Buffer.from(newNullifier, "hex")
    );

    // Generate addLeafSmall proof
    const addSmallLeafCode = `import "hashes/blake2/blake2s" as leafHash;
    def main(u32[8] oldLeaf, u32[8] newLeaf, u32[5] address, private u32[7] creds, private u32[4] oldNullifier, private u32[4] newNullifier) {
        u32[1][16] oldPreimage = [[...address, ...creds, ...oldNullifier]];
        u32[1][16] newPreimage = [[...address, ...creds, ...newNullifier]];
        assert(leafHash(oldPreimage) == oldLeaf);
        assert(leafHash(newPreimage) == newLeaf);
        return;
    }`;
    const proofArgs = [
      signedLeaf,
      newLeaf,
      arrayifiedAddr,
      arrayifiedCreds,
      arrayifiedNullifier,
      arrayifiedNewNullifier,
    ];
    const zokratesProvider = await initializeZokrates();
    const artifacts = zokratesProvider.compile(addSmallLeafCode);
    const { witness, output } = zokratesProvider.computeWitness(artifacts, proofArgs);
    const keypair = zokratesProvider.setup(artifacts.program);
    const proof = zokratesProvider.generateProof(
      artifacts.program,
      witness,
      keypair.pk
    );
    // const isVerified = zokratesProvider.verify(keypair.vk, proof);
    // TODO: Store proof

    // TODO: Generate proof that creds=="US"

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

export { ProofGenerator, createSmallCredsLeaf };
