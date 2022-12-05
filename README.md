# Requirements


### Install Deps (all needed to run cronjobs and app)

- `npm install` at the root folder
- Sugar: https://github.com/metaplex-foundation/sugar
- Metaboss: https://github.com/samuelvanderwaal/metaboss
- Solana and Solana Keygen command line clients

### Setup Environment

Please check `.env.template` to validate which softwares/database and keys you need in order to succeed running all the cronjobs and BE/FE (NextJS) app successfully.

Also, please do this checklist:

- Configure the Solana CLI: `solana config set -k ~/.config/solana/pathtoyourkeyasInt8Array.json` and `solana config set --url ALCHEMYRPCURL`
- You need a PGSQL DB to connect with the Prisma/NextJS app, that is used by both the FE/BE app as well by the cronjobs scripts. After getting a DB connection string, replace into the .env file and run `yarn db-push` to migrate the database using Prisma.
- You will need to get both a Quicknode and Alchemy RPC Urls --- luckily, there is a free account on both of these -- so just grab the RPC url and replace on the .env file.
- For uploading NFT resources (JSON and media files) immutabily on the blockchain, we use NFT storage. So create an account there and input into the .env file.
- For setting diffused.art main wallet vault -- that both owns/deploy candy machines, receives the mint funds, and receives 10% of the percentage of mint royalties of each collection --, fund a wallet with SOL and then properly set `FUNDED_WALLET_SECRET_KEY` and `FUNDED_WALLET_PUBKEY`. This is also important to write to the blockchain e.g. update metadata for revealing using the AI art
- Finally, for supporting generating the images using the correct params, you can either run your StableDiffusion grpc server locally OR create a free account on Dreamstudio. Either way, get the APIKEY for the gprc server available in both, and replace the value of `DREAMSTUDIO_API_KEY`. This will assure StableDiffusion AISource generation will work correctly for updating the NFT and making it immutable.
- In order to test the cronjob/scripts that fetch a hash list, try to reveal the NFTs; and try to reinsert the not confirmed items, you can seed the DB with sample data and create a dummy CM by running `yarn seed-db && yarn create-cm-db --slugUrl paramValue`. Finally, run `yarn reinsert-non-confirmed-items-insert --cmid CMID` to guarantee all items have been inserted (validate for a message like "All items have been inserted on the candy machine {CMID}"). PS: You can always run sugar withdraw CANDYMACHINEID on the terminal to withdraw the money used to upload the candy machine.

### Running the NextJS app
- The NextJS app features a route `http://localhost:3000/api/mint/MINTHASH/reveal` that runs the reveal on a specific mint address synchronously. So, just mint from the CM, and send a POST request to this route using the mint hash of your minted NFT to try to reveal it using NextJS server. PS: You can mint 5 items locally using `yarn mint-from-cmid --cmid`
- TBD: Connect to the UI, mint and review


### Revealing minted NFTs from non fully revealed collection candy machines
The correct process for revealing arts for specific candy machines mints and making them immutable, as well as writing the unique seed is to follow this checklist:
- Run `refresh-hashlists` to get a list of minted hashes from all non revealed candy machines we have on the Collection DB
- Finally, run `reveal-all-minted-nfts`. Check the logs for errors, or that everything went smooth. If everything went smooth, you can just run it again, and it should in theory have 0 success and 0 failures, indicating it is on a neutral state: no NFTs to reveal, all revealed.~~

#### Running the scripts as a cronjob (using node-cron)
- This basically manages running `refresh-hashlists` and `reveal-all-minted-nfts` for you. To run the node-cron jobs for the scripts above, just run `yarn reveal-cronjobs` and watch the logs get printed on your console.


# Miscellaneous
### How to generate JS/TS SDKs stubs for StableDiffusion API

Run ```sudo rm -rf ./api-interfaces && git clone --recurse-submodules git@github.com:Stability-AI/api-interfaces.git```

- `npm_config_target_arch=x64 ./scripts/download-and-build-sd-lib.sh`
- This will replace the existing SDKs, don't forget to validate if everything still works on generating StableDiffusion against dreamstudio after this
- This might not work because the protoc binary committed to the repo is used for ARM only; to fix, just download a new protoc binary from the official protoc gen repo for your OS, and replace the files inside "binaries" folder before running this