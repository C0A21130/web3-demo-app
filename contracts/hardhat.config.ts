import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://10.203.92.63:8545"
    },
    quorum: {
      url: "http://10.203.92.92:22000",
      accounts: ["0x8fa5c1adcea492787c8e6580bb78079f8332e38c3d515f869a6646b2382a1567"]
    }
  },
  gasReporter: {
    enabled: true,
  }
};

export default config;
