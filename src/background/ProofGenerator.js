import { Buffer } from "buffer/";
import { IncrementalMerkleTree } from "@zk-kit/incremental-merkle-tree";
import { encryptForServer, createSmallLeaf } from "./utils";
import {
  zkIdVerifyEndpoint,
  serverAddress,
  unitedStatesCredsBuffer,
} from "./constants";

class ProofGenerator {
  static async generateProof(credentials, proofType) {
    if (proofType == "addSmallLeaf-country") {
      return await this.getAddSmallLeafProofCountry(
        credentials.countryCode,
        credentials.countryCodeSecret
      );
    }
    if (proofType == "PoKoPoML-country") {
      return await this.getPoKoPoMLCountry(
        credentials.countryCode,
        credentials.countryCodeSecret
      );
    }
  }

  static async getAddSmallLeafProofCountry(countryCode, countryCodeSecret) {
    const args = {
      creds: countryCode,
      secret: countryCodeSecret,
    };
    // NOTE: Use AWS KMS in production
    const { encryptedMessage: encryptedArgs } = await encryptForServer(
      JSON.stringify(args)
    );
    const resp = await fetch(
      `${zkIdVerifyEndpoint}/proofs/addSmallLeaf?args=${encryptedArgs}`
    );
    const data = await resp.json();
    // shape of response: { data: smallLeafProof: { scheme: 'g16', curve: 'bn128', proof: [Object], inputs: [Array] },  newSecret: newSecretAsBuffer.toString("hex") }
    // storeProof(data.data);
    console.log("getAddSmallLeafProofCountry: retrieved proof");
    // TODO: Update countryCodeSecret stored in HoloStore
    return data.data;
  }

  /**
   * Proof of Knowledge of Preimage of Member Leaf.
   * For small leaves.
   * @param countryCode
   * @param {string} secret Hexstring representing 16 bytes
   */
  static async getPoKoPoMLCountry(countryCode, secret) {
    console.log("getPoKoPoMLCountry: entered");
    console.log(`getPoKoPoMLCountry: countryCode: ${countryCode}. secret: ${secret}`);
    let countryCodeAsBuffer;
    if (countryCode == 2) {
      countryCodeAsBuffer = unitedStatesCredsBuffer;
    } else {
      // TODO: Add support for other countries
      throw new Error(
        "Operation not supported. Trying to generate proof where countryCode != 2."
      );
    }
    const args = {
      creds: countryCode,
      secret: secret,
    };
    const { encryptedMessage, sharded } = await encryptForServer(JSON.stringify(args));
    const encryptedArgs = Array.isArray(encryptedMessage)
      ? JSON.stringify(encryptedMessage)
      : encryptedMessage;
    const resp = await fetch(
      `${zkIdVerifyEndpoint}/proofs/proveKnowledgeOfPreimageOfMemberLeaf?args=${encryptedArgs}&sharded=${sharded}`
    );
    const data = await resp.json();
    // shape of response: { data: proofOfKnowledgeOfPreimage: { scheme: 'g16', curve: 'bn128', proof: [Object], inputs: [Array] } }
    // TODO: Send proof to relayer
    console.log("getPoKoPoMLCountry: retrieved proof...");
    console.log(data.data);
  }
}

export default ProofGenerator;
