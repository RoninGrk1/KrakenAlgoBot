import { SiweMessage } from "siwe";

export async function verifySiwe(message: string, signature: string, expectedNonce: string, expectedAddress: string) {
  const siwe = new SiweMessage(message);
  if (siwe.nonce !== expectedNonce) throw new Error("nonce mismatch");
  if (siwe.address.toLowerCase() !== expectedAddress.toLowerCase()) throw new Error("address mismatch");
  const result = await siwe.verify({ signature, nonce: expectedNonce });
  if (!result.success) throw new Error("invalid signature");
  return siwe.address;
}
