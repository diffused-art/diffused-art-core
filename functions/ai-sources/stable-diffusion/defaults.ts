export const STABLE_DIFFUSION_DEFAULTS_FOR_METADATA = {
  engine: 'stable-diffusion-v1-5',
  width: 640,
  height: 640,
  diffusion: 'k_lms',
  steps: 50,
  cfgScale: 7,
  samples: 1,
  start_schedule: 0.5,
  end_schedule: 0.5,
}

export const STABLE_DIFFUSION_DEFAULTS = {
  ...STABLE_DIFFUSION_DEFAULTS_FOR_METADATA,
  host: 'https://grpc.stability.ai:443',
  initImage: (undefined as any),
}
