// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SsdlabTokenModule = buildModule("SsdlabTokenModule", (m) => {
  const teacherAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const studentAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const operatorAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const ssdlabToken = m.contract("SsdlabToken", [teacherAddress, studentAddress]);
  const scoring = m.contract("Scoring", [operatorAddress]);

  return { ssdlabToken, scoring };
});

export default SsdlabTokenModule;