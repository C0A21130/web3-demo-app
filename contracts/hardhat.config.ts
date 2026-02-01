import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
      },
    }
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    quorum: {
      type: "http",
      chainType: "l1",
      url: "http://10.203.92.69:22000",
      chainId: 1337,
      accounts: ["0x9219477c394a4581aa7d440f85d77eee294580c17b5be14dbccea33d552687da"]
    },
  }
});
