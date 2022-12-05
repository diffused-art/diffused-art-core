export enum GUIDANCE_PRESETS {
  GUIDANCE_PRESET_NONE = 0,
  GUIDANCE_PRESET_SIMPLE = 1,
  GUIDANCE_PRESET_FAST_BLUE = 2,
  GUIDANCE_PRESET_FAST_GREEN = 3,
  GUIDANCE_PRESET_SLOW = 4,
  GUIDANCE_PRESET_SLOWER = 5,
  GUIDANCE_PRESET_SLOWEST = 6,
}
export const STABLE_DIFFUSION_DEFAULTS_FOR_METADATA = {
  engine: 'stable-diffusion-v2-0',
  width: 640,
  height: 640,
  diffusion: 'k_lms' as "ddim" | "plms" | "k_euler" | "k_euler_ancestral" | "k_heun" | "k_dpm_2" | "k_dpm_2_ancestral" | "k_lms",
  steps: 50,
  cfgScale: 7,
  samples: 1,
  start_schedule: 0.5,
  end_schedule: 0.01,
  guidance_preset: GUIDANCE_PRESETS.GUIDANCE_PRESET_NONE,
  guidance_cuts: 0,
  guidance_strength: 0.25,
  guidance_prompt: undefined,
  guidance_models: undefined,
};

export const STABLE_DIFFUSION_DEFAULTS = {
  ...STABLE_DIFFUSION_DEFAULTS_FOR_METADATA,
  host: 'https://grpc.stability.ai:443',
  initImage: undefined as any,
};
