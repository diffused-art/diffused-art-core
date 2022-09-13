import axios from 'axios';
import { createWriteStream } from 'fs';
import * as stream from 'stream';
import { promisify } from 'util';

const STUBS_LIST = [
  {
    url: 'https://raw.githubusercontent.com/Stability-AI/stability-sdk/main/src/js/generation_pb.d.ts',
    path: './functions/ai-sources/stable-diffusion/stubs/generation_pb.d.ts',
  },
  {
    url: 'https://raw.githubusercontent.com/Stability-AI/stability-sdk/main/src/js/generation_pb.js',
    path: './functions/ai-sources/stable-diffusion/stubs/generation_pb.js',
  },
  {
    url: 'https://raw.githubusercontent.com/Stability-AI/stability-sdk/main/src/js/generation_pb_service.d.ts',
    path: './functions/ai-sources/stable-diffusion/stubs/generation_pb_service.d.ts',
  },
  {
    url: 'https://raw.githubusercontent.com/Stability-AI/stability-sdk/main/src/js/generation_pb_service.js',
    path: './functions/ai-sources/stable-diffusion/stubs/generation_pb_service.js',
  },
];

const finished = promisify(stream.finished);

export async function downloadFile(fileUrl, outputLocationPath) {
  const writer = createWriteStream(outputLocationPath);
  return axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then(response => {
    response.data.pipe(writer);
    return finished(writer);
  });
}

export async function downloadStableDiffusionLib() {
  for (let index = 0; index < STUBS_LIST.length; index++) {
    const element = STUBS_LIST[index];
    await downloadFile(element.url, element.path);
  }
}
downloadStableDiffusionLib();
