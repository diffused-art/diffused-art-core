import Rand, { PRNG } from 'rand-seed';

function chunkSubstr(str: string) {
  const numChunks = 4;
  const chunkSize = Math.ceil(str.length / numChunks);
  const chunks = new Array(numChunks);
  for (let i = 0; i < numChunks; i++) {
    chunks[i] = str.substr(i * chunkSize, chunkSize);
  }
  const seed1 = chunks[0] + chunks[1];
  const seed2 = chunks[2] + chunks[3];
  return [seed1, seed2];
}

export class Random {
  useA = false;
  prngA: Rand | undefined;
  prngB: Rand | undefined;
  constructor(hash: string) {
    const [seedA, seedB] = chunkSubstr(hash);
    this.prngA = new Rand(seedA, PRNG.sfc32);
    this.prngB = new Rand(seedB, PRNG.sfc32);
    for (let i = 0; i < 1e6; i += 2) {
      this.prngA.next();
      this.prngB.next();
    }
  }

  // random number between 0 (inclusive) and 1 (exclusive)
  random_dec() {
    this.useA = !this.useA;
    return this.useA ? this.prngA?.next() : this.prngB?.next();
  }
  // random number between a (inclusive) and b (exclusive)
  random_num(a: number, b: number) {
    return a + (b - a) * (this.random_dec() as any);
  }
  // random integer between a (inclusive) and b (inclusive)
  // requires a < b for proper probability distribution
  random_int(a: number, b: number) {
    return Math.floor(this.random_num(a, b + 1));
  }
}
