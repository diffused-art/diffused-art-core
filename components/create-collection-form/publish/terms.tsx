import React from 'react'
import { ActionTypesCreateCollectionStore, useCreateCollectionStore } from '../../../hooks/useCreateCollectionStore';
import LabeledCheckboxInput from '../../form/labeled/LabeledCheckboxInput'

export default function PublishTerms() {
  const { state, dispatch } = useCreateCollectionStore();

  if (state.publishStep !== 'terms') return null;

  const terms = `
  - Purpose of the Agreement: This agreement outlines the terms and conditions for using diffused.art, a software product that allows artists to use AI for creating NFT collections.

  - Definition of diffused.art: diffused.art refers to the software product and the company that operates it.
  
  - Use of diffused.art: The user is granted a limited, non-exclusive, non-transferable license to use diffused.art for the purpose of creating NFT collections.
  
  - Ownership of NFT Collections: The user retains ownership of any NFT collections created using diffused.art. diffused.art claims no ownership rights to any NFT collections created by the user.
  
  - Intellectual Property Rights: The user acknowledges that diffused.art holds all intellectual property rights to the software and its underlying technology. The user agrees not to reverse engineer, decompile, or disassemble the software or use it for any unauthorized purposes.
  
  - Warranties and Representations: diffused.art makes no warranties or representations about the accuracy or completeness of the information provided through the software. The user assumes all risks associated with the use of diffused.art.
  
  - Indemnification: The user agrees to indemnify and hold diffused.art harmless from any claims, damages, or expenses that arise from the use of diffused.art for the purposes of creating this collection.
  
  - Acknowledge of AI Art Generation Algorithm: The user acknowledges that they have thoroughly tested the underlying AI art generation algorithm for the prompts they are submitting as a collection. The user understands that diffused.art is not liable for any generation that includes hateful, NSFW, or criminal content that might be generated and monetized through its platform. The user is the one liable, as the owner and artist behind the collection.
  
  - Right to Shut Down User Access: diffused.art reserves the right to shut down user access (as well as delete collections that are live) from its platform website in case the user engages in generating hateful, NSFW, or criminal content or uses the platform for purposes of selling content in order to support hateful, NSFW, or criminal content.
  
  - Authority to Tweak "Candy Machine" Configuration and Mint NFTs: diffused.art holds the authority to tweak the "Candy Machine" configuration and mint NFTs. The authority is granted in order to update the NFT arts on the user's behalf using the AI art revealing algorithm, which is open source. After the NFTs are revealed, they are managed by the diffused.art protocol, which makes NFTs fully immutable. As a result, diffused.art never gives back the authority to update data on chain, as it is useless.
  
  - Beta Preview Version: For the beta preview version, diffused.art holds the funds for the mints and agrees to deliver the funds to the artist within 24 hours after the collection closes or fully mints out.
  
  - Entitlement to Proceeds: diffused.art is entitled to 10% of all proceedings, which includes 10% of the minting funds and 10% of the royalties of secondary sales that the NFTs might generate in the future. The remaining 90% of the proceeds are delivered to the artist.
  
  - Governing Law: This agreement will be governed by the laws of Brazil.
  
  - Entire Agreement: This agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, understandings, and agreements between the parties.
  `
  return (
    <div className="w-full relative">
      <h1>We require that you agree to the terms of service before
        publishing your collection:</h1>
      <pre className="overflow-auto max-h-[500px] max-w-full bg-gray-700 rounded my-5">
        {terms}
      </pre>
      <div className="flex justify-end">
        <LabeledCheckboxInput
          label="I agree"
          onChange={() => {
            dispatch({
              type: ActionTypesCreateCollectionStore.SetFieldValue,
              payload: {
                field: 'publishStep',
                value: 'upload',
              }
            });
          }}
        />
      </div>
    </div>

  )
}
