// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MyERC5185Module = buildModule("MyERC5185Module", (m) => {
  // コントラクトのコンストラクタ引数
  const name = m.getParameter("name", "ERC5185 Updatable NFT");
  const symbol = m.getParameter("symbol", "ERC5185");

  // ERC5185コントラクトをデプロイ
  const myERC5185 = m.contract("MyERC5185", [name, symbol]);

  return { myERC5185 };
});

export default MyERC5185Module;
