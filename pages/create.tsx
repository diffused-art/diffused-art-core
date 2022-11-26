import Head from 'next/head';
import Footer from '../components/footer';
import Header from '../components/header';
import CloseSVG from 'assets/svg/cross-small.svg';
import PromptSVG from 'assets/svg/prompt.svg';
import ConfigureSVG from 'assets/svg/configure.svg';
import PublishSVG from 'assets/svg/publish.svg';
import InfoSVG from 'assets/svg/info.svg';
import ImgSVG from 'assets/svg/picture.svg'

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
                    <span className='mr-3'><PromptSVG fill="white" class="h-5" /></span>
                    <span className='text-xl'>Prompt</span>
                  </button>
                </li>
                <li className='bread-item'>
                  <button className='bread-btn flex items-center'>
                    <span className='mr-3'><ConfigureSVG fill="white" class="h-5" /></span>
                    <span className='text-xl'>Configure</span>
                  </button>
                </li>
                <li className='bread-item'>
                  <button className='bread-btn flex items-center'>
                    <span className='mr-3'><PublishSVG fill="white" class="h-5" /></span>
                    <span className='text-xl'>Publish</span>
                  </button>
                </li>
              </ul>
            </div>

          </div>
          <div className='col-span-6'>
            <div className='flex justify-between mb-6 items-center'>
              <h1 className='text-3xl'>Prompt your imagination</h1>
              <a href='' className='flex opacity-50 items-center'>Learn how to prompt like a pro
                <InfoSVG fill="white" class="h-4 ml-2" />
              </a>
            </div>
            <div className='h-16 w-full mb-6'>
              <label className="block">
                <span className="text-gray-700 hidden">Full name</span>
                <input type="text" className="
                    mt-1
                    block
                    w-full
                    rounded-md
                    bg-gray-100
                    border-transparent
                    focus:border-gray-500 focus:bg-white focus:ring-0
                  " placeholder="A portrait of a cosmonaut riding a cat in the style of Monet" />
              </label>
            </div>
            <div className='grid grid-cols-2 gap-6'>
              <div className='col-span-1 bg-fourth p-5'>
                <label className="block mb-6">
                  <div className="text-white ml-2 mb-2">Initial image <span className='text-white text-opacity-40 ml-1 text-sm w-2/3 leading-4 font-sansLight'>Upload a reference for your prompt</span></div>
                  <div className='relative'>
                    <input type="text" className="
                        mt-1
                        block
                        w-full
                        rounded-md
                        bg-third
                        border-transparent
                        pr-12
                        focus:border-third focus:bg-white focus:bg-opacity-20 focus:ring-0
                      " placeholder="select an image" />
                    <ImgSVG fill="white" class="absolute right-4 h-5 top-2.5" />
                  </div>

                </label>
                <label className="block mb-6">
                  <div className="text-white ml-2 mb-2">CFG Scale <span className='text-white text-opacity-40 block text-sm w-2/3 leading-4 font-sansLight'>Adjust how much the image will be like your prompt. Higher values keep your image closer to your prompt.</span></div>
                  <div className='relative'>
                    <input type="text" className="
                        mt-1
                        block
                        w-full
                        rounded-md
                        bg-third
                        border-transparent
                        pr-12
                        focus:border-third focus:bg-white focus:bg-opacity-20 focus:ring-0
                      " placeholder="select an image" />
                    <ImgSVG fill="white" class="absolute right-4 h-5 top-2.5" />
                  </div>

                </label>
                <label className="block mb-6">
                  <div className="text-white ml-2 mb-2">Size <span className='text-white text-opacity-40 text-sm w-2/3 leading-4 font-sansLight'>Maximum 3000px width / 3000 px height</span></div>
                  <div className='relative flex gap-4'>
                    <input type="number" className="
                        mt-1
                        block
                        w-full
                        rounded-md
                        bg-third
                        border-transparent
                        pr-12
                        focus:border-third focus:bg-white focus:bg-opacity-20 focus:ring-0
                      " placeholder="width" />
                      <input type="number" className="
                        mt-1
                        block
                        w-full
                        rounded-md
                        bg-third
                        border-transparent
                        pr-12
                        focus:border-third focus:bg-white focus:bg-opacity-20 focus:ring-0
                      " placeholder="height" />
                  </div>

                </label>
                
              </div>
              <div className='col-span-1 bg-fourth h-60 p-5'>

              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Create;
