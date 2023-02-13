import Head from 'next/head';
import Menu from '../components/menu';
import ArtistLoginRequired from '../components/artist-login-required';
import { Toaster } from 'react-hot-toast';
import CreateCollectionStoreProvider from '../hooks/useCreateCollectionStore';
import CreateCollectionFormPrompt from '../components/create-collection-form/prompt';
import CreateCollectionFormConfiguration from '../components/create-collection-form/configuration';
import CreateCollectionFormPublish from '../components/create-collection-form/publish';

const CreatePage = () => (
  <div className="bg-secondary-50">
    <Head>
      <title>diffused.art</title>
      <meta
        name="description"
        content="Truly immutable on-chain 1/1 AI art generated in real time"
      />
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <Menu />

    <ArtistLoginRequired>
      <CreateCollectionStoreProvider>
        {/* First step, prompt ideation */}
        <CreateCollectionFormPrompt />
        {/* Second step, series configuration */}
        <CreateCollectionFormConfiguration />
        {/* Third step, series publish */}
        <CreateCollectionFormPublish />
      </CreateCollectionStoreProvider>
    </ArtistLoginRequired>
    <Toaster />
  </div>
);

export default CreatePage;
