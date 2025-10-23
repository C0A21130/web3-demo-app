import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MemberSBTDemoModule = buildModule("MemberSBTDemoModule", (m) => {
  // --- デプロイ時のコンストラ
  const name = "DemoSBT";
  const symbol = "DSBT";
  const isLocked = true;
  
  // デプロイに使用するアカウントを管理者として設定します
  const ownerAdmin = m.getAccount(0);

  // --- MemberSbtDemo コントラクトのデプロイを定義 ---
  // "MemberSbtDemo" は Solidity ファイルのコントラクト名と一致させます
  const demoSbt = m.contract("MemberSbtDemo", [
    name,
    symbol,
    isLocked,
    ownerAdmin, // 引数は4つ
  ]);

  return { demoSbt };
});

export default MemberSBTDemoModule;