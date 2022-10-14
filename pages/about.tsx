import Head from 'next/head';
import Footer from '../components/footer';
import Header from '../components/header';
import CloseSVG from 'assets/svg/cross-small.svg';

const About = () => {
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

      <div className="flex flex-col min-h-full justify-center items-center justify-items-center">
        <main className="flex flex-col space-y-5 justify-center items-center !min-h-[80vh] px-20 text-center container">
          <div className="space-y-1">
            <h2 className="text-lg">
              AI art is the latest evolution of digital art; and more
              specifically, generative art.
            </h2>
            <h2 className="text-lg">
              In essence, it is a form of generative art, like algorithmic art.
            </h2>
            <h2 className="text-lg">
              Different than algorithmic art, AI art is generated by a neural
              network, which means there is no need for the artist to know a
              specific programming language or library.
            </h2>
            <h2 className="text-lg">
              Similar to algorithmic art, tho, AI art is able generate unique
              outputs that are reproducible for the authentication of the art
              using its seed.
            </h2>
          </div>

          <div className="space-y-1 pt-10">
            <h2 className="text-lg">
              Currently, existing solutions don&apos;t grasp the real potential
              of AI art as the most powerful tool for generative art, which in
              our opinion is what makes AI art so special.
            </h2>
            <h2 className="text-lg">
              Another common problem for AI art is authenticity. The art must be
              reproducible and at the same unique in the entire universe given
              the signature is the same.
            </h2>
            <h2 className="text-lg">
              The Solana blockchain is perfect for guaranteeing the last missing
              piece of authenticated art: truly immutable unique token addresses
              guaranteed by fast blockchain consensus.
            </h2>
          </div>

          <div className="space-y-1 pt-10">
            <h2 className="text-lg">
              We believe we are just at the tip of the iceberg for AI art; but
              we also think it is the future of digital art.
            </h2>
            <h2 className="text-lg">
              A new art renaissance has begun, and we are here to help you get
              in on the ground floor.
            </h2>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default About;
