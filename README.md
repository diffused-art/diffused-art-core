# Getting Started

- Need to have a valid .env.template file (WIP: Docker Compose file that will generate this for you)

For running locally, run:
```bash
npm run install
npm run dev
```

# Miscellaneous
### How to generate JS/TS SDKs stubs for StableDiffusion API

Run ```sudo rm -rf ./api-interfaces && git clone --recurse-submodules git@github.com:Stability-AI/api-interfaces.git```

- `npm_config_target_arch=x64 ./scripts/download-and-build-sd-lib.sh`
- This will replace the existing SDKs, don't forget to validate if everything still works on generating StableDiffusion against dreamstudio after this
- This might not work because the protoc binary committed to the repo is used for ARM only; to fix, just download a new protoc binary from the official protoc gen repo for your OS, and replace the files inside "binaries" folder before running this