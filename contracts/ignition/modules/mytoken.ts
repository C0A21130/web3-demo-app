// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const myTokenModule = buildModule("myTokenModule", (m) => {
  const initialOwner = m.getAccount(0);
  const myToken = m.contract("MyToken", [initialOwner]);

  return { myToken };
});

export default myTokenModule;
