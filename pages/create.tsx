import Head from 'next/head';
import Footer from '../components/footer';
import Header from '../components/header';
import CloseSVG from 'assets/svg/cross-small.svg';
import PromptSVG from 'assets/svg/prompt.svg';
import ConfigureSVG from 'assets/svg/configure.svg';
import PublishSVG from 'assets/svg/publish.svg';
import { Label, TextInput, Checkbox, Button  } from "flowbite-react";

const Create = () => {
  return (
    <div>
      <Head>
        <title>diffused. about.</title>
        <meta
          name="description"
          content="Truly immutable on-chain 1/1 AI art generated in real time"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />

        <main className="max-w-6xl mx-auto">
          <div className='grid grid-cols-6'>
              <div className='col-span-4 col-start-2 mb-16'>
                <div className='w-full px-32'>
                  <ul className='bread flex justify-between relative'>
                    <li className='bread-item'> 
                      <button className='bread-btn active flex items-center'>
                        <span className='mr-3'><PromptSVG fill="white" class="h-5"/></span>
                        <span className='text-xl'>Prompt</span>
                      </button>
                    </li>
                    <li className='bread-item'>
                      <button className='bread-btn flex items-center'>
                        <span className='mr-3'><ConfigureSVG fill="white" class="h-5"/></span>
                        <span className='text-xl'>Configure</span>
                      </button>
                    </li>
                    <li className='bread-item'>
                      <button className='bread-btn flex items-center'>
                        <span className='mr-3'><PublishSVG fill="white" class="h-5"/></span>
                        <span className='text-xl'>Publish</span>
                      </button>
                    </li>
                  </ul>
                </div>
                
              </div>
              <div className='col-span-6'>
                  <div className='flex justify-between'>
                    <h1 className='text-3xl'>Prompt your imagination</h1>
                    <div>
                      <a href=''>Learn how to prompt like a pro</a>
                    </div>
                  </div>
                  <div>
                  <form className="flex flex-col gap-4">
  <div>
    <div className="mb-2 block">
      <Label
        htmlFor="email1"
        value="Your email"
      />
    </div>
    <TextInput
      id="email1"
      type="email"
      placeholder="name@flowbite.com"
      required={true}
    />
  </div>
  <div>
    <div className="mb-2 block">
      <Label
        htmlFor="password1"
        value="Your password"
      />
    </div>
    <TextInput
      id="password1"
      type="password"
      required={true}
    />
  </div>
  <div className="flex items-center gap-2">
    <Checkbox id="remember" />
    <Label htmlFor="remember">
      Remember me
    </Label>
  </div>
  <Button type="submit">
    Submit
  </Button>
</form>
                  </div>
                </div>
          </div>
        </main>
        <Footer />
      </div>
  );
};

export default Create;
