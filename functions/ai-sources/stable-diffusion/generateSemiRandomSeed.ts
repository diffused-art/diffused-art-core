import { Random } from "../../../utils/generateSemiRandom";

export function generateSemiRandomNumberStableDiffusionRange(mintAddress: string) {
  const randomClass = new Random(mintAddress);
  // Same range used by Stability AI SDK
  return randomClass.random_int(1, 4294967294);
}