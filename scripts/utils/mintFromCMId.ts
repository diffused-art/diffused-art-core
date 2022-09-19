import shell from 'shelljs';

async function mintFromCMID() {
  const result = require('minimist')(process.argv.slice(2));

  console.info(`Minting 5 items from the CM... ${result.cmid}`);
  if (
    shell.exec(
      `sugar mint --candy-machine ${result.cmid} --cache ./cache-output -n 5`,
    ).code !== 0
  ) {
    shell.echo('Error: Couldnt mint 5 items');
    shell.exit(1);
    return;
  }

  console.info(`5 NFTs successfully minted for the CMID ${result.cmid}`);

  return;
}

mintFromCMID();
