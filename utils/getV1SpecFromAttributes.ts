import { SpecObject } from "../typings";


export function getV1SpecFromAttributes(attributes: {
  [key: string]: unknown;
  trait_type?: string | undefined;
  value?: string | undefined;
}[]): SpecObject {
  const specObject: SpecObject = { sourceParams: {} } as any;
  for (let index = 0; index < attributes.length; index++) {
    const attribute = attributes[index];
    if (attribute.trait_type && ['prompt', 'init_image', 'source'].includes(attribute.trait_type)) {
      specObject[attribute.trait_type as 'prompt' | 'init_image' | 'source'] = attribute.value!;
    }

    if (attribute.trait_type?.includes('source-param:')) {
      specObject.sourceParams[attribute.trait_type.replace('source-param:', '')] = attribute.value!;
    }
  }

  return specObject;
}