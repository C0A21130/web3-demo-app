// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SsdlabTokenModule = buildModule("SsdlabTokenModule", (m) => {
  const agentAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Hardhat Account #0 address
  const ssdlabToken = m.contract("SsdlabToken", [agentAddress]);
  const credential = m.contract("MemberSbtDemo", ["DemoSBT", "DSBT", true, agentAddress]);
  return { ssdlabToken, credential };
});

export default SsdlabTokenModule;