import Head from 'next/head';
import Menu from '../components/menu';
import ArtistLoginRequired from '../components/artist-login-required';
import { Toaster } from 'react-hot-toast';
import CreateCollectionStoreProvider from '../hooks/useCreateCollectionStore';
import CreateCollectionFormPrompt from '../components/create-collection-form/prompt';

// TODO: Add local storage to this reducer (use wallet address as composable on the key): https://www.benmvp.com/blog/sync-localstorage-react-usereducer-hook/
// TODO: Proper clean up of creating collection (trahs icon, on this page), with modal are you sure
// TODO: Add warning like all your chnages are persisted on your browser for the specific logged in wallet
// TODO: Should have multiple create pages for each stage
// TODO: All pages should have an warning that all changes are only published at the last step, publish
// TODO: Allow to go back on the other pages that are not the prompt one
const CreatePage = () => (
  <div className="bg-secondary-50">
    <Head>
      <title>diffused.</title>
      <meta
        name="description"
        content="Truly immutable on-chain 1/1 AI art generated in real time"
      />
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <Menu />

    <ArtistLoginRequired>
      <CreateCollectionStoreProvider>
        {/* First form, prompt ideation */}
        <CreateCollectionFormPrompt />
      </CreateCollectionStoreProvider>
    </ArtistLoginRequired>
    <Toaster />
  </div>
);

export default CreatePage;
