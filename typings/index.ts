export enum AISource {
  STABLEDIFFUSION = 'stable_diffusion',
}

export interface SpecObject {
  prompt: string;
  init_image?: string;
  source: string;
  sourceParams: { [key: string]: unknown };
}