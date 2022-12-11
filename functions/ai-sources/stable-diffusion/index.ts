import { grpc } from '@improbable-eng/grpc-web';
import { GenerationService } from './stubs/generation_pb_service';
import {
  Request,
  Prompt,
  ImageParameters,
  SamplerParameters,
  TransformType,
  StepParameter,
  PromptParameters,
  ClassifierParameters,
  Answer,
  ArtifactType,
  Artifact,
  ScheduleParameters,
  GuidanceParameters,
  GuidanceInstanceParameters,
  Model,
  CutoutParameters,
} from './stubs/generation_pb';
import { NodeHttpTransport } from '@improbable-eng/grpc-web-node-http-transport';
import uuid4 from 'uuid4';
import mime from 'mime';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

import { diffusionMap } from './utils';
import { SpecObject } from '../../../types';
import axios from 'axios';
import { STABLE_DIFFUSION_DEFAULTS } from './defaults';

type DraftStabilityOptions = Partial<{
  outDir: string;
  debug: boolean;
  requestId: string;
  samples: number;
  engine:
    | 'stable-diffusion-v1'
    | 'stable-diffusion-v1-4'
    | 'stable-diffusion-v1-5'
    | 'stable-diffusion-512-v2-0'
    | 'stable-diffusion-512-v2-1'
  host: string;
  seed: number;
  width: number;
  height: number;
  diffusion?: keyof typeof diffusionMap;
  steps: number;
  cfgScale: number;
  noStore: boolean;
  start_schedule: number;
  end_schedule: number;
  guidance_preset: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  guidance_cuts: number;
  guidance_strength: number;
  guidance_prompt?: string;
  guidance_models?: string[];

  initImage?: Uint8Array | undefined;
}>;

type RequiredStabilityOptions = {
  apiKey: string;
  prompt: string;
};

type StabilityOptions = RequiredStabilityOptions &
  Required<DraftStabilityOptions>;

type StabilityApi = TypedEmitter<{
  image: (data: { buffer: Buffer; filePath: string }) => void;
  end: (data: {
    isOk: boolean;
    status: keyof grpc.Code;
    code: grpc.Code;
    message: string;
    trailers: grpc.Metadata;
  }) => void;
}>;

const withDefaults: (
  draftOptions: DraftStabilityOptions & RequiredStabilityOptions,
) => StabilityOptions = draft => {
  if (!draft.prompt) throw new Error('Prompt is required');

  const requestId = draft.requestId ?? uuid4();
  return {
    ...draft,
    host: draft.host ?? STABLE_DIFFUSION_DEFAULTS.host,
    engine: draft.engine ?? (STABLE_DIFFUSION_DEFAULTS.engine as any),
    requestId,
    seed: draft.seed as any,
    width: draft.width ?? STABLE_DIFFUSION_DEFAULTS.width,
    height: draft.height ?? STABLE_DIFFUSION_DEFAULTS.height,
    diffusion: draft.diffusion ?? (STABLE_DIFFUSION_DEFAULTS.diffusion as any),
    steps: draft.steps ?? STABLE_DIFFUSION_DEFAULTS.steps,
    cfgScale: draft.cfgScale ?? STABLE_DIFFUSION_DEFAULTS.cfgScale,
    samples: draft.samples ?? STABLE_DIFFUSION_DEFAULTS.samples,
    initImage: draft.initImage ?? (undefined as any),
    outDir: draft.outDir ?? path.join(process.cwd(), '.out', requestId),
    debug: Boolean(draft.debug),
    start_schedule:
      draft.start_schedule ?? STABLE_DIFFUSION_DEFAULTS.start_schedule,
    end_schedule: draft.end_schedule ?? STABLE_DIFFUSION_DEFAULTS.end_schedule,
    noStore: Boolean(draft.noStore),
    guidance_preset:
      draft.guidance_preset ?? STABLE_DIFFUSION_DEFAULTS.guidance_preset,
    guidance_cuts:
      draft.guidance_cuts ?? STABLE_DIFFUSION_DEFAULTS.guidance_cuts,
    guidance_strength:
      draft.guidance_strength ?? STABLE_DIFFUSION_DEFAULTS.guidance_strength,
    guidance_prompt:
      (draft.guidance_prompt as any) ??
      (STABLE_DIFFUSION_DEFAULTS.guidance_prompt as any),
    guidance_models:
      (draft.guidance_models as any) ??
      (STABLE_DIFFUSION_DEFAULTS.guidance_models as any),
  };
};

export const generateStableDiffImage: (
  opts: DraftStabilityOptions & RequiredStabilityOptions,
) => StabilityApi = opts => {
  let {
    host,
    engine,
    requestId,
    seed,
    width,
    height,
    diffusion,
    steps,
    cfgScale,
    samples,
    outDir,
    prompt: promptText,
    initImage,
    apiKey,
    noStore,
    debug,
    start_schedule,
    end_schedule,
    guidance_preset,
    guidance_prompt,
    guidance_models,
    guidance_cuts,
    guidance_strength,
  } = withDefaults(opts);

  if (!promptText) throw new Error('Prompt text is required');

  const api = new EventEmitter() as StabilityApi;

  mkdirp.sync(outDir);

  /** Build Request **/
  const request = new Request();
  request.setEngineId(engine);
  request.setRequestId(requestId);

  const step = new StepParameter();
  step.setScaledStep(0);
  const sampler = new SamplerParameters();
  sampler.setCfgScale(cfgScale);
  // Sampler/diffusion is only set if guidance preset is not available
  if (guidance_preset !== 0) {
    const guidanceInstanceParam = new GuidanceInstanceParameters();
    if (guidance_prompt) {
      let guidancePromptParam = new Prompt();
      guidancePromptParam.setText(guidance_prompt);
      guidanceInstanceParam.setPrompt(guidancePromptParam);
    }

    if (guidance_strength > 0) {
      guidanceInstanceParam.setGuidanceStrength(guidance_strength);
    }

    if ((guidance_models?.length || 0) > 0) {
      guidanceInstanceParam.setModelsList(
        guidance_models.map(modelAlias => {
          const model = new Model();
          model.setAlias(modelAlias);
          return model;
        }),
      );
    }

    if (guidance_cuts) {
      const cutoutParams = new CutoutParameters();
      cutoutParams.setCount(guidance_cuts);
      guidanceInstanceParam.setCutouts(cutoutParams);
    }

    const guidanceParam = new GuidanceParameters();
    guidanceParam.setGuidancePreset(guidance_preset);
    guidanceParam.addInstances(guidanceInstanceParam);
    step.setGuidance(guidanceParam);
  } else {
    step.setSampler(sampler);
  }

  const prompt = new Prompt();
  prompt.setText(promptText);
  request.addPrompt(prompt);

  if (initImage) {
    const promptParameters = new PromptParameters();
    promptParameters.setInit(true);
    const initImagePrompt = new Prompt();
    initImagePrompt.setParameters(promptParameters);

    const imagePromptArtifact = new Artifact();
    imagePromptArtifact.setType(ArtifactType.ARTIFACT_IMAGE);
    imagePromptArtifact.setBinary(initImage);

    initImagePrompt.setArtifact(imagePromptArtifact);
    request.addPrompt(initImagePrompt);

    const scheduleParameters = new ScheduleParameters();
    scheduleParameters.setStart(start_schedule);
    scheduleParameters.setEnd(end_schedule);
    step.setSchedule(scheduleParameters);
  }

  const image = new ImageParameters();
  image.setWidth(width);
  image.setHeight(height);
  image.setSeedList([seed]);
  image.setSteps(steps);
  image.setSamples(samples);
  const transform = new TransformType();
  transform.setDiffusion(diffusionMap[diffusion]);
  image.setTransform(transform);

  image.addParameters(step);

  const classifier = new ClassifierParameters();
  request.setClassifier(classifier);
  request.setImage(image);
  console.info(
    '[stability - request]',
    JSON.stringify(request.toObject(), null, 2),
  );
  /** End Build Request **/

  if (debug) {
    console.info(
      '[stability - request]',
      JSON.stringify(request.toObject(), null, 2),
    );
  }

  grpc.invoke(GenerationService.Generate, {
    request,
    host,
    metadata: new grpc.Metadata({ Authorization: `Bearer ${apiKey}` }),
    transport: NodeHttpTransport(),
    onEnd: (code, message, trailers) => {
      api.emit('end', {
        isOk: code === grpc.Code.OK,
        status: grpc.Code[code] as keyof grpc.Code,
        code,
        message,
        trailers,
      });
    },
    onMessage: (message: Answer) => {
      const answer = message.toObject();

      if (answer.artifactsList) {
        answer.artifactsList.forEach(
          ({ id, type, mime: mimeType, binary, seed: innerSeed }) => {
            if (type === ArtifactType.ARTIFACT_IMAGE) {
              // @ts-ignore
              const buffer = Buffer.from(binary, 'base64');
              const filePath = path.resolve(
                path.join(
                  outDir,
                  `${answer.answerId}-${id}-${innerSeed}.${mime.getExtension(
                    mimeType,
                  )}`,
                ),
              );

              if (!noStore) fs.writeFileSync(filePath, buffer);

              api.emit('image', {
                buffer,
                filePath,
              });
            }
          },
        );
      }
    },
    debug,
  });

  return api;
};

interface StableDiffusionPromptParams extends SpecObject {
  sourceParams: Pick<
    DraftStabilityOptions & RequiredStabilityOptions,
    | 'cfgScale'
    | 'diffusion'
    | 'engine'
    | 'height'
    | 'width'
    | 'samples'
    | 'steps'
    | 'seed'
  >;
}

export async function generateStableDiffImageAsync(
  promptObject: StableDiffusionPromptParams,
): Promise<{ buffer: Buffer; filePath: String }[]> {
  let initImage: Uint8Array | undefined = undefined;
  if (promptObject.init_image) {
    const bufferData = await axios
      .get(promptObject.init_image, {
        responseType: 'arraybuffer',
      })
      .then(response => Buffer.from(response.data, 'binary'));
    initImage = new Uint8Array(
      bufferData.buffer,
      bufferData.byteOffset,
      bufferData.byteLength / Uint8Array.BYTES_PER_ELEMENT,
    );
  }

  return new Promise(resolve => {
    const api = generateStableDiffImage({
      apiKey: process.env.DREAMSTUDIO_API_KEY!,
      prompt: promptObject.prompt,
      seed: promptObject.seed as number,
      initImage,
      ...promptObject.sourceParams,
      outDir: path.join(process.cwd(), '.out', 'test'),
      // debug: true,
    });

    const images: any[] = [];

    api.on('image', data => {
      console.info('[stability - image]', data);
      images.push(data);
    });

    api.on('end', data => {
      console.info('[stability - end]', data);
      resolve(images);
    });
  });
}
