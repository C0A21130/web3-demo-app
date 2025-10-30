import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://10.203.92.63:8545"
    },
  },
  gasReporter: {
    enabled: true,
  }
};

export default config;
