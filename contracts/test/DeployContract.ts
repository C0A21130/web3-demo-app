import { expect } from "chai";
import { network } from "hardhat";
import deployContractModule from "../ignition/modules/DeployContract.js";

const { ignition, ethers } = await network.connect();

describe("DeployContract Ignition Module", function () {
	it("SsdlabToken と MemberSbtDemo をデプロイできる", async function () {
		console.log("[開始] DeployContract モジュールのデプロイテスト");
		const { ssdlabToken, DeployContract } = await ignition.deploy(deployContractModule, {
			defaultSender: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
		});
		console.log("[完了] Ignition デプロイ実行");

		// コントラクトのデプロイが成功しているか確認
		expect(await ssdlabToken.getAddress()).to.not.equal(ethers.ZeroAddress);
		expect(await DeployContract.getAddress()).to.not.equal(ethers.ZeroAddress);
		console.log("[OK] コントラクトアドレスの取得に成功");

		// SsdlabToken の名前とシンボルが正しいか確認
		expect(await ssdlabToken.name()).to.equal("SsdlabToken");
		expect(await ssdlabToken.symbol()).to.equal("SSDLAB");
		console.log("[OK] SsdlabToken の name/symbol を確認");

		// MemberSbtDemo の名前とシンボルが正しいか確認
		expect(await DeployContract.name()).to.equal("DemoSBT");
		expect(await DeployContract.symbol()).to.equal("DSBT");
		console.log("[OK] MemberSbtDemo の name/symbol を確認");

		// 指定アドレスに DEFAULT_ADMIN_ROLE が付与されているか確認
		expect(
			await DeployContract.hasRole(
				ethers.ZeroHash,
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
			)
		).to.equal(true);
		console.log("[OK] DEFAULT_ADMIN_ROLE の付与を確認");
	});
});

