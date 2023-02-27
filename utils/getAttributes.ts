import { AISource } from "../types";
import { GUIDANCE_PRESETS } from '../functions/ai-sources/stable-diffusion/defaults';

export function getAttributes(collection) {
  const attributes: any[] = [];

  if (collection.promptSource === 'STABLEDIFFUSION') {
    attributes.push({
      trait_type: 'source',
      value: AISource.STABLEDIFFUSION,
    });
  }

  if (collection.promptPhrase) {
    attributes.push({
      trait_type: 'prompt',
      value: collection.promptPhrase,
    });
  }

  if (collection.promptInitImage) {
    attributes.push({
      trait_type: 'init_image',
      value: collection.promptInitImage,
    });
  } else {
    delete collection.promptSourceParams.start_schedule;
    delete collection.promptSourceParams.end_schedule;
  }

  if (
    collection.promptSourceParams.guidance_preset ===
    GUIDANCE_PRESETS.GUIDANCE_PRESET_NONE
  ) {
    delete collection.promptSourceParams.guidance_preset;
    delete collection.promptSourceParams.guidance_cuts;
    delete collection.promptSourceParams.guidance_strength;
    delete collection.promptSourceParams.guidance_prompt;
    delete collection.promptSourceParams.guidance_models;
  } else {
    collection.promptSourceParams.guidance_cuts === 0
      ? delete collection.promptSourceParams.guidance_cuts
      : undefined;
    collection.promptSourceParams.guidance_strength === 0
      ? delete collection.promptSourceParams.guidance_strength
      : undefined;
    collection.promptSourceParams.guidance_prompt === 0
      ? delete collection.promptSourceParams.guidance_prompt
      : undefined;
    collection.promptSourceParams.guidance_models === 0
      ? delete collection.promptSourceParams.guidance_models
      : undefined;
  }

  attributes.push(
    ...(Object.entries(collection.promptSourceParams as any).map(
      ([key, value]) => {
        return {
          trait_type: `source-param:${key}`,
          value,
        };
      },
    ) as any[]),
  );

  return attributes;
}