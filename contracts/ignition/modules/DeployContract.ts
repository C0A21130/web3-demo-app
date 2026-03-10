// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const deployContractModule = buildModule("deployContractModule", (m) => {
  const agentAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // 要修正？アドレス変える？
  const ssdlabToken = m.contract("SsdlabToken", [agentAddress]);
  const DeployContract = m.contract("MemberSbtDemo", ["DemoSBT", "DSBT", true, agentAddress]);

  return { ssdlabToken, DeployContract };
});

export default deployContractModule;