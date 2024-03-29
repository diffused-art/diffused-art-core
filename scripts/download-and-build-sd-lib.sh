#!/bin/bash
# sudo rm -rf ./api-interfaces
# git clone git@github.com:Stability-AI/api-interfaces.git
sudo chmod -R 777 ./binaries/protoc
sudo chmod -R 777 ./api-interfaces/src/bin/protoc
cp ./binaries/protoc ./api-interfaces/src/bin/protoc
cd ./api-interfaces
cmake .
sudo chmod +x ./src/bin/protoc
cmake --build . 
cp ./gooseai/generation/generation_grpc_pb.d.ts ../functions/ai-sources/stable-diffusion/stubs/generation_grpc_pb.d.ts
cp ./gooseai/generation/generation_grpc_pb.js ../functions/ai-sources/stable-diffusion/stubs/generation_grpc_pb.js
cp ./gooseai/generation/generation_pb_service.d.ts ../functions/ai-sources/stable-diffusion/stubs/generation_pb_service.d.ts
cp ./gooseai/generation/generation_pb_service.js ../functions/ai-sources/stable-diffusion/stubs/generation_pb_service.js
cp ./gooseai/generation/generation_pb.d.ts ../functions/ai-sources/stable-diffusion/stubs/generation_pb.d.ts
cp ./gooseai/generation/generation_pb.js ../functions/ai-sources/stable-diffusion/stubs/generation_pb.js
cp ./gooseai/generation/tensors_pb.js ../functions/ai-sources/stable-diffusion/stubs/tensors_pb.js
cp ./gooseai/generation/tensors_pb.d.ts ../functions/ai-sources/stable-diffusion/stubs/tensors_pb.d.ts

echo "Copied files"