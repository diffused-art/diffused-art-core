import { Disclosure, Transition } from '@headlessui/react';
import {
  ChevronUpIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { JsonMetadata } from '@metaplex-foundation/js';
import { Artist, Collection, Mint, Prisma } from '@prisma/client';
import axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useInterval } from 'usehooks-ts';
import Footer from '../../components/footer';
import Menu from '../../components/menu';
import MintButton from '../../components/mint-button';
import MintModal from '../../components/mint-modal';
import NoSSR from '../../components/no-ssr';
import Tag from '../../components/tag';
import useToast, { ToastIconEnum } from '../../hooks/useToast';
import { IconTwitter } from '../../icons/icon-twitter';
import { useCandyMachine } from '../../lib/candy-machine';
import prisma from '../../lib/prisma';

export const getServerSideProps = async context => {
  const collection = await prisma.collection.findUnique({
    include: {
      artist: {
        select: {
          twitterURL: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      mints: {
        select: {
          mint_address: true,
          rawMetadataCDN: true,
          title: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        where: {
          rawMetadata: {
            not: Prisma.JsonNull,
          },
        },
        take: 10,
      },
      CollectionTag: {
        include: {
          tag: true,
        },
      },
    },
    where: {
      slugUrl: String(context.params?.slugUrl),
    },
  });

  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: { CollectionTag: true },
      },
    },
    where: {
      isEnabled: true,
      CollectionTag: {
        some: {
          tagId: {
            in:
              collection?.CollectionTag.map(
                collectionTag => collectionTag.tagId,
              ) || [],
          },
        },
      },
    },
    orderBy: {
      label: 'asc',
    },
  });

  delete (collection || {})['CollectionTag'];

  if (!collection) return { notFound: true };
  return {
    props: {
      collection: {
        ...collection,
        updateAuthorityPrivateKey: null,
        mintPrice: collection.mintPrice.toNumber(),
        mintOpenAt: collection.mintOpenAt.getTime(),
        createdAt: collection.createdAt.getTime(),
        updatedAt: collection.updatedAt.getTime(),
        artist: {
          ...collection.artist,
          isCollectionCreationEnabled: false,
          createdAt: collection.artist.createdAt.getTime(),
          updatedAt: collection.artist.updatedAt.getTime(),
        },
        hashList: [],
        tags: tags.map(tag => ({
          label: tag.label,
          count: tag._count.CollectionTag,
        })),
      },
    },
  };
};

interface DropsSlugPageProps {
  collection: Collection & {
    artist: Artist;
    tags: { label: string; count: number }[];
    mints: {
      rawMetadataCDN: JsonMetadata;
      mint_address: string;
      title: string;
    }[];
  };
}

const DropsSlugPage = ({ collection }: DropsSlugPageProps) => {
  const toast = useToast();
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const { onMint, isMinting, candyMachine } = useCandyMachine(
    collection.mintCandyMachineId!,
    collection.updateAuthorityPublicKey!,
  );
  const [isMintOpen, setIsMintOpen] = useState(false);

  useInterval(
    () => {
      setIsMintOpen(
        new Date(Date.now()) >
          new Date(
            candyMachine?.candyGuard?.guards.startDate?.date.toNumber()! * 1000,
          ),
      );
    },
    isMintOpen ? null : 30000,
  );

  const date = useMemo(() => {
    return new Date(
      candyMachine?.candyGuard?.guards.startDate?.date.toNumber()! * 1000,
    );
  }, [candyMachine]);

  useEffect(() => setIsMintOpen(new Date(Date.now()) > date), [date]);

  const [activeMintHash, setActiveMintHash] = useState<string | null>(null);
  const [activeMint, setActiveMint] = useState<Mint | null>(null);

  const onMintCB = useCallback(async () => {
    setIsMintModalOpen(true);
    const mintHash = await onMint();
    if (mintHash === null) {
      setIsMintModalOpen(false);
      setActiveMintHash(null);
      toast({
        message: 'User refused to sign in the mint transaction',
        icon: ToastIconEnum.FAILURE,
      });
    } else {
      setActiveMintHash(mintHash);
    }
  }, [onMint, toast]);

  const onCloseModal = useCallback(() => {
    setIsMintModalOpen(false);
    setActiveMintHash(null);
    setActiveMint(null);
  }, []);

  useInterval(
    () => {
      axios
        .get(`/api/mint/${activeMintHash}`)
        .then(res => {
          const mint: Mint = res.data.data;
          if (mint?.isRevealed) {
            setActiveMint(mint);
          }
        })
        .catch(() => setActiveMint(null));
    },
    activeMintHash && !activeMint ? 30000 : null,
  );
  const pageTitle = `diffused.art "${collection.title}"`;
  return (
    <div className="bg-secondary-50">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={collection.description} key="desc" />

        <meta
          property="og:url"
          content={`https://www.diffused.art/drops/${collection.slugUrl}`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={collection.description} />
        <meta property="og:image" content={collection.bannerImageURL} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="diffused.art" />
        <meta
          property="twitter:url"
          content={`https://www.diffused.art/drops/${collection.slugUrl}`}
        />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={collection.description} />
        <meta name="twitter:image" content={collection.bannerImageURL} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col justify-center items-center justify-items-center">
        <Menu />

        <MintModal
          isMinting={isMinting}
          open={isMintModalOpen}
          closeModal={onCloseModal}
          nftPlaceholderURL={collection.nftPlaceholderImageURL!}
          mintHash={activeMintHash}
          mint={activeMint}
        />

        <main className="flex flex-col space-y-8 justify-center items-center !min-h-[80vh] my-5 px-2 container mt-[80px] md:mt-[100px]">
          {collection.isDemo && (
            <div className="bg-yellow-opaque text-white p-2 rounded-md text-center">
              Disclaimer: This mint is done purely for tech demonstration and
              has no intrinsic value or any benefit attached to it.
              <br />
              It is just immutable art stored on the blockchain, nothing more,
              nothing less.
            </div>
          )}
          <div className="grid grid-cols-3 justify-center items-start gap-10 relative">
            <div className="col-span-3 lg:col-span-2 justify-center flex lg:sticky top-0 pt-[0px] md:pt-[80px]">
              <img
                src={collection.bannerImageURL}
                alt={collection?.title}
                className="rounded-md w-full max-w-[500px] lg:max-w-[640px]"
              />
            </div>
            <div className="col-span-3 lg:col-span-1 space-y-5 my-5">
              <h1 className="text-[25px] text-white font-semibold leading-[1]">
                {collection.title}
              </h1>
              <h2 className="text-[16px] font-light leading-[24px] text-white-half-transparent text-justify">
                {collection.description}
              </h2>
              <h3 className="text-[16px] text-white font-normal flex flex-col">
                <span>Creator</span>
                <div className="flex">
                  <Link
                    href={`/?search=${collection.artist.username}`}
                    className="!text-white-half-transparent hover:opacity-25"
                  >
                    @{collection.artist.username}
                  </Link>
                  <a
                    href={collection.artist.twitterURL!}
                    target="_blank"
                    rel="noreferrer"
                    className="!text-white-half-transparent font-light cursor-pointer hover:opacity-25"
                  >
                    <IconTwitter height={24} />
                  </a>
                </div>
              </h3>

              <h3 className="text-[16px] text-white font-normal flex flex-col">
                <span>Keywords</span>
                <div>
                  {collection.tags.map(tag => (
                    <Link
                      key={tag.label}
                      href={`/?search=${tag.label}`}
                      className="hover:opacity-75"
                    >
                      <Tag label={tag.label} count={tag.count} />
                    </Link>
                  ))}
                </div>
              </h3>
              <NoSSR>
                <div id="candy-machine-data" className="space-y-5">
                  <div className="flex space-x-5 lg:space-x-0 lg:grid lg:grid-cols-3 lg:gap-3">
                    {isMintOpen ? (
                      <>
                        <h3 className="text-[16px] text-white font-normal flex flex-col">
                          <span>Price</span>
                          <span className="!text-white-half-transparent font-light">
                            {(candyMachine?.candyGuard?.guards.solPayment?.amount.basisPoints?.toNumber() ||
                              0) /
                              Math.pow(
                                10,
                                candyMachine?.candyGuard?.guards.solPayment
                                  ?.amount.currency.decimals || 0,
                              )}{' '}
                            SOL
                          </span>
                        </h3>
                        <h3 className="text-[16px] text-white font-normal flex flex-col">
                          <span>Supply</span>
                          <span className="!text-white-half-transparent font-light">
                            {candyMachine?.itemsAvailable.toNumber()}
                          </span>
                        </h3>
                        <h3 className="text-[16px] text-white font-normal flex flex-col">
                          <span>Remaining</span>
                          <span className="!text-white-half-transparent font-light">
                            {candyMachine?.itemsRemaining.toNumber()}
                          </span>
                        </h3>
                      </>
                    ) : (
                      <h3 className="text-[16px] col-span-3 text-white font-normal flex justify-center">
                        Not available yet.{' '}
                        {date && `Drop will start at ${date.toLocaleString()}`}
                      </h3>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {isMintOpen && (
                      <MintButton onMint={onMintCB} isLoading={isMinting} />
                    )}
                    <a
                      href="https://docs.diffused.art/dream/buyer-first-time"
                      target="_blank"
                      rel="noreferrer"
                      title="Learn more about minting a Diffused Art NFT"
                    >
                      <QuestionMarkCircleIcon
                        className="text-main-yellow"
                        height={26}
                      />
                    </a>
                  </div>
                </div>
              </NoSSR>
            </div>
          </div>

          <Disclosure defaultOpen>
            {({ open }) => (
              <div className="w-full">
                <Disclosure.Button className="flex w-full justify-between rounded-lg py-2 text-left font-medium text-white hover:bg-secondary-90 transition-all my-1">
                  <span className="ml-5">Generation Parameters</span>
                  <ChevronUpIcon
                    className={`${
                      open ? 'rotate-180 transform' : ''
                    } h-5 w-5 text-white mr-5`}
                  />
                </Disclosure.Button>
                <Transition
                  enter="transition duration-100 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                >
                  <Disclosure.Panel className="grid grid-cols-5 w-full p-5 gap-5 bg-secondary-90 border-t-secondary-100 border-b-secondary-100 border-t-2 border-b-2">
                    <h3 className="text-[16px] text-white font-normal flex flex-col col-span-5 lg:col-span-1">
                      <span>AI Model</span>
                      <span className="!text-white-half-transparent font-light">
                        {collection.promptSource.toLowerCase()}
                      </span>
                    </h3>
                    <h3 className="text-[16px] col-span-5 lg:col-span-2 text-white font-normal flex flex-col">
                      <span>Prompt</span>
                      <span className="!text-white-half-transparent font-light">
                        {collection.promptPhrase}
                      </span>
                    </h3>
                    <h3 className="text-[16px] col-span-5 lg:col-span-2 text-white font-normal flex flex-col">
                      <span>Technics</span>
                      <span className="!text-white-half-transparent font-light">
                        Dynamic seed: each art is unique and immutable by using
                        a derivation of the NFT address that gets generated on
                        mint time
                      </span>
                    </h3>
                    {collection.promptInitImage && (
                      <h3 className="text-[16px] col-span-5 text-white font-normal flex flex-col justify-center space-y-2">
                        <span>Init Image</span>
                        <span className="!text-white-half-transparent font-light">
                          All generated arts take the init image as the base
                          layer for generating the prompt phrase
                        </span>
                        <a
                          href={collection.promptInitImage}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            className="rounded-md max-h-[400px]"
                            alt="Prompt Init Image"
                            src={collection.promptInitImage}
                          />
                        </a>
                      </h3>
                    )}
                  </Disclosure.Panel>
                </Transition>
              </div>
            )}
          </Disclosure>
          {collection.mints.length > 0 && (
            <div className="flex flex-col justify-start items-start w-full">
              <h4 className="ml-5 w-full py-2 text-left font-medium text-white my-1">
                Last minted
              </h4>
              <div className="overflow-auto max-w-full flex space-x-5 pb-3">
                {collection.mints.map(mint => (
                  <a
                    key={mint.mint_address}
                    href={`https://solscan.io/address/${mint.mint_address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="cursor-pointer relative group"
                  >
                    <div
                      className="invisible group-hover:visible rounded-md pb-2 absolute w-full bottom-0 z-10 opacity-85 text-white 
                    cursor-pointer text-xs md:text-lg bg-gray-half-transparent"
                    >
                      <div className="ml-5 flex flex-col">
                        <span>{mint.title}</span>
                        <span className="text-main-yellow">
                          @{collection.artist.username}
                        </span>
                      </div>
                    </div>
                    <img
                      alt={mint.title}
                      src={mint.rawMetadataCDN.image}
                      className="rounded-md max-w-[260px] lg:max-w-[340px]"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </main>
        <Footer ctaEnabled={false} twitterEnabled={false} />
      </div>
      <Toaster />
    </div>
  );
};

export default DropsSlugPage;
