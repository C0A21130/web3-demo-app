// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const quorumModule = buildModule("quorumModule", (m) => {
  const agentAddress = "0xc5ecd88ba49ff3eb34a329656422f463cc2572e7"; // Quorum Agent Contract Address
  const ssdlabToken = m.contract("SsdlabToken", [agentAddress]);
  const credential = m.contract("MemberSbtDemo", ["DemoSBT", "DSBT", true, agentAddress]);
  return { ssdlabToken, credential };
});

export default quorumModule;