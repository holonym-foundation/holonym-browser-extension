import { initialize } from "zokrates-js";

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
  generateUnitedStatesPoR(issuer, creds, secret) {
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

export { ProofGenerator };
