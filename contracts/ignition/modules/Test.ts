// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TestModule = buildModule("LockModule", (m) => {

  const test = m.contract("Test");

  return { test };
});

export default TestModule;