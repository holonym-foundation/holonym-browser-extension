# Holonym

This extension stores credentials that can be used to generate zk proofs about aspects of one's identity.

Holonym website: https://holonym.io/

## Requirements

- Node ^16.14.2
- Rollup (used for general bundling)

### Credential object schema

The extension can store any credentials that follow two constraints:

- Credentials must be an object with no nested objects. The value that is encrypted and sent to the extension should not, when decrypted, be a string or number. It must be an object and must not contain other objects.
- It must include an `issuer` attribute, and `issuer` must be of type `string`. This is important because credentials are sorted by issuer when they are stored by the extension.

The following is an example of a valid credentials object sent to the extension.

    {
        birthdate: "",
        completedAt: "",
        countryCode: 2,
        secret: "",
        serverSignature: "",
        subdivision: "",
        issuer: "0x0000000000000000000000000000000000000000"
    }

The following is an example of how credentials are stored within the extension. The credentials object will look like this for the rest of its lifetime, so both the webpage frontend and other parts of the extension should expect an object with this kind of shape when they request credentials. Note that there can be any number of issuer-credentials pairings.

    {
        "0x0000000000000000000000000000000000000000": {
            birthdate: "",
            completedAt: "",
            countryCode: 2,
            secret: "",
            serverSignature: "",
            subdivision: "",
            issuer: "0x0000000000000000000000000000000000000000"
        }
    }
