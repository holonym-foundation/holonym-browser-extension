# window.holonym

This extension injects a `holonym` object onto the webpage `window` object. The `holonym` object provides an interface for interacting with the extension backend.

## Functions

_Unprivileged_ functions can be called by any webpage.

_Privileged_ functions can only be called by Holonym webpages. More specifically, all domains listed in manifest.json as "externally_connectable" are privileged. If a webpage with a domain outside of the externally_connectable list tries to call one of the privileged functions, the caller will receive an error.

The function signatures are provided in TypeScript syntax.

### Unprivileged functions

#### holoGetIsRegistered()

    ```typescript
    window.holonym.holoGetIsRegistered(): Promise<boolean>
    ```

Returns a boolean indicating whether the user has set their password and generated their encryption/decryption keys.

#### hasPassword()

    ```typescript
    window.holonym.hasPassword(): Promise<boolean>
    ```

Alias for `holoGetIsRegistered()`.

#### getHoloPublicKey()

    ```typescript
    window.holonym.getHoloPublicKey(): Promise<SubtleCrypto.JWK>
    ```

Returns the user's public key.

#### holoGetHasCredentials()

    ```typescript
    window.holonym.holoGetHasCredentials(): Promise<boolean>
    ```

Returns a boolean indicating whether the user has credentials.

#### hasHolo()

    ```typescript
    window.holonym.hasHolo(): Promise<boolean>
    ```

Alias for `holoGetHasCredentials()`.

### Privileged functions

#### promptSetPassword()

    ```typescript
    interface ReturnValue {
        userSetPassword: boolean
    }
    window.holonym.promptSetPassword(): Promise<ReturnValue>
    ```

Returns an object with an attribute `userSetPassword`, which indicates whether the user has set their password.

#### addLeafMetadata(issuer, leafTxMetadata)

    ```typescript
    interface TransactionMetadata {
        blockNumber: number
        txHash: string
    }
    interface Args {
        issuer: string
        leafTxMetadata: TransactionMetadata
    }
    interface ReturnValue {
        success: boolean
    }
    window.holonym.addLeafMetadata(Args): Promise<ReturnValue>
    ```

Returns an object with an attribute `success`, which indicates whether the leaf transaction metadata was successfully added.

#### getLeafMetadata()

    ```typescript
    interface TransactionMetadata {
        blockNumber: number
        txHash: string
    }
    interface ReturnValue {
        [string]: TransactionMetadata
    }
    window.holonym.getLeafMetadata(): Promise<ReturnValue>
    ```

Returns an object where, at the top level, each key is an issuer address, and each value is a TransactionMetadata object.

#### addSubmittedProof(issuer, proofTxMetadata)

    ```typescript
    interface TransactionMetadata {
        blockNumber: number
        txHash: string
    }
    interface Args {
        issuer: string
        leafTxMetadata: TransactionMetadata
    }
    interface ReturnValue {
        success: boolean
    }
    window.holonym.addSubmittedProof(Args): Promise<ReturnValue>
    ```

Returns an object with an attribute `success`, which indicates whether the proof transaction metadata was successfully added.

#### getSubmittedProofs()

    ```typescript
    interface TransactionMetadata {
        blockNumber: number
        txHash: string
    }
    interface ReturnValue {
        [string]: TransactionMetadata
    }
    window.holonym.getSubmittedProofs(): Promise<ReturnValue>
    ```

Returns an object where, at the top level, each key is an issuer address, and each value is a TransactionMetadata object.
