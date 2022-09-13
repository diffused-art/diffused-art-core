import Rand, { PRNG } from 'rand-seed';

function chunkSubstr(str: string, size: number) {
  const numChunks = Math.ceil(str.length / size);
  const chunks = new Array(numChunks);

  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size);
  }

  return chunks;
}

export class Random {
  useA = false;
  prngA: Rand | undefined;
  prngB: Rand | undefined;
  constructor(hash: string) {
    let sfc32 = function (uint128Hex: string) {
      let a = parseInt(uint128Hex.substr(0, 8), 16);
      let b = parseInt(uint128Hex.substr(8, 8), 16);
      let c = parseInt(uint128Hex.substr(16, 8), 16);
      let d = parseInt(uint128Hex.substr(24, 8), 16);
      return function () {
        a |= 0;
        b |= 0;
        c |= 0;
        d |= 0;
        let t = (((a + b) | 0) + d) | 0;
        d = (d + 1) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
      };
    };

    const [firstHalf, secondHalf] = chunkSubstr(hash, 2);
    this.prngA = new Rand(firstHalf, PRNG.sfc32);
    this.prngB = new Rand(secondHalf, PRNG.sfc32);
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
