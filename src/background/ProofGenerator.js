import { ethers } from "ethers";
import { blake2s } from "blakejs";
import { Buffer } from "buffer/";
import { initialize as initializeZokrates } from "zokrates-js";
import { generateSecret, toU32StringArray } from "./utils";
import { serverAddress } from "./constants";

/**
 * Takes strings, properly formats them (according to spec), and returns a hash.
 * See: https://opsci.gitbook.io/untitled/4alwUHFeMIUzhQ8BnUBD/extras/leaves
 * @param {string} issuer Blockchain address of account that issued the credentials
 * @param {string} creds Credentials (e.g., "Alice" or "US")
 * @param {string} secret Hex string representation of 16 bytes
 */
function createSmallCredsLeaf(issuer, creds, secret) {
  const arrayifiedAddr = ethers.utils.arrayify(issuer);
  const arrayifiedSecret = ethers.utils.arrayify(secret);
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
    const signedLeaf = Buffer.from(
      createSmallCredsLeaf(serverAddress, creds, nullifier)
    );
    const newNullifier = generateSecret();
    const newLeaf = Buffer.from(
      createSmallCredsLeaf(serverAddress, creds, newNullifier)
    );

    const addrAsBuffer = Buffer.from(serverAddress.slice(2), "hex");
    const nullifierAsBuffer = Buffer.from(nullifier, "hex");
    const credsAsBuffer = Buffer.concat([Buffer.from(creds || "")], 28);

    const newNullifierAsBuffer = Buffer.from(newNullifier, "hex");

    // Generate addLeafSmall proof
    const addSmallLeafCode = `import "hashes/blake2/blake2s" as leafHash;
    def main(u32[8] oldLeaf, u32[8] newLeaf, u32[5] address, private u32[7] creds, private u32[4] oldNullifier, private u32[4] newNullifier) {
        u32[1][16] oldPreimage = [[...address, ...creds, ...oldNullifier]];
        u32[1][16] newPreimage = [[...address, ...creds, ...newNullifier]];
        assert(leafHash(oldPreimage) == oldLeaf);
        assert(leafHash(newPreimage) == newLeaf);
        return;
    }`;
    const aslArgs = [
      signedLeaf,
      newLeaf,
      addrAsBuffer,
      credsAsBuffer,
      nullifierAsBuffer,
      newNullifierAsBuffer,
    ].map((arg) => toU32StringArray(arg));
    const aslZokratesProvider = await initializeZokrates();
    const aslArtifacts = aslZokratesProvider.compile(addSmallLeafCode);
    const { aslWitness, aslOutput } = aslZokratesProvider.computeWitness(
      aslArtifacts,
      aslArgs
    );
    const aslKeypair = aslZokratesProvider.setup(aslArtifacts.program);
    const aslProof = aslZokratesProvider.generateProof(
      aslArtifacts.program,
      aslWitness,
      aslKeypair.pk
    );
    const aslIsVerified = aslZokratesProvider.verify(aslKeypair.vk, aslProof);
    console.log(`aslIsVerified: ${aslIsVerified}`);
    // TODO: Store proof

    // Generate proof that creds == "US"
    const proveResidenceCode = `import "hashes/blake2/blake2s" as leafHash;
    def main(u32[8] leaf, u32[5] address, private u32[7] creds, private u32[4] nullifier) {
        u32[1][16] preimage = [[...address, ...creds, ...nullifier]];
        assert(leafHash(preimage) == leaf);
        // assert creds == "US"
        assert(creds[0] == 1431502848);
        for u32 i in 1..6 {
            assert(creds[i] == 0);
        }
        return;
    }`;
    const prArgs = [newLeaf, addrAsBuffer, credsAsBuffer, newNullifierAsBuffer].map(
      (arg) => toU32StringArray(arg)
    );
    const prZokratesProvider = await initialize();
    const prArtifacts = prZokratesProvider.compile(proveResidenceCode);
    const { prWitness, prOutput } = prZokratesProvider.computeWitness(
      prArtifacts,
      prArgs
    );
    const prKeypair = prZokratesProvider.setup(prArtifacts.program);
    const prProof = prZokratesProvider.generateProof(
      prArtifacts.program,
      prWitness,
      prKeypair.pk
    );
    const prIsVerified = prZokratesProvider.verify(prKeypair.vk, prProof);
    console.log(`prIsVerified: ${prIsVerified}`);
    // TODO: Store proof

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
