import { AISource } from '../types';

export default function getSourceFromEngine(engineValue: string) {
  if (engineValue.includes('stable-diffusion')) {
    return AISource.STABLEDIFFUSION;
  }
  return AISource.STABLEDIFFUSION;
}
