// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const localhostModule = buildModule("localhostModule", (m) => {
  const agentAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Hardhat Account #0 address
  const ssdlabToken = m.contract("SsdlabToken", [agentAddress]);
  const credential = m.contract("MemberSbtDemo", ["DemoSBT", "DSBT", true, agentAddress]);
  const governanceToken = m.contract("GovernanceToken");
  const CustomGovernor = m.contract("CustomGovernor", [governanceToken, ssdlabToken]);

  return { ssdlabToken, credential, governanceToken, CustomGovernor };
});

export default localhostModule;