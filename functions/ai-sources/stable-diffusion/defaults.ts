export const STABLE_DIFFUSION_DEFAULTS = {
  host: 'https://grpc.stability.ai:443',
  engine: 'stable-diffusion-v1-5',
  width: 512,
  height: 512,
  diffusion: 'k_lms',
  steps: 50,
  cfgScale: 7,
  samples: 1,
  initImage: (undefined as any),
  start_schedule: 0.5,
  end_schedule: 0.5,
}