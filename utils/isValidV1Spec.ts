import { object, string, number, date, array } from 'yup';

let v1SpecSchemaStableDiffusion = object({
  prompt: string().required(),
  init_image: string(),
  source: string().matches(/(stable_diffusion)/).required(),
  sourceParams: object({
    engine: string().matches(/(stable-diffusion-v1|stable-diffusion-v1-4|stable-diffusion-v1-5|stable-diffusion-512-v2-0|stable-diffusion-512-v2-1)/).required(),
    width: number().integer().min(512).max(1024).required(),
    height: number().integer().min(512).max(1024).required(),
    diffusion: string().matches(/(k_lms|ddim|plms|k_euler|k_euler_ancestral|k_heun|k_dpm_2|k_dpm_2_ancestral)/),
    steps: number().integer().min(10).max(150).required(),
    cfgScale: number().integer().min(0).max(20).required(),
    samples: number().integer().min(1).max(9).required(),
    start_schedule: number().min(0).max(1),
    end_schedule: number().min(0).max(1),
    guidance_preset: number().integer().min(0).max(6),
    guidance_cuts: number().integer().min(0).max(100),
    guidance_strength: number().min(0).max(1),
    guidance_prompt: string(),
    guidance_models: array(string()),
  })
});

export async function isValidV1SpecStableDiffusion(specObject: any) {
  const result = await v1SpecSchemaStableDiffusion.validate(specObject).then(() => true).catch(() => false);
  return result;
}