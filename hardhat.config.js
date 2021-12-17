require("@nomiclabs/hardhat-waffle");
const fs = require("fs")
const privateKey = fs.readFileSync(".secret").toString()
const projectId = "1IISvtbO2J8Uz_s2akC4cdk9qm6rnrY0"
const projectId2 = "bat3o5Yn3r7wIyuciSnvajbGedpk2Zur"

module.exports = {
  networks: {
    hardhat: {
      chainId: 1337
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${projectId}`,
      accounts: [privateKey]
    },
    mainnet: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${projectId2}`,
      accounts: [privateKey]
    }
  },
  solidity: {
    version: "0.8.4",
  }
};
