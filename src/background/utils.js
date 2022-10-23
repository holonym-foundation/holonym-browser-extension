import { ethers } from "ethers";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function generateSecret() {
  const newSecret = new Uint8Array(16);
  crypto.getRandomValues(newSecret);
  return ethers.BigNumber.from(newSecret).toHexString();
}
