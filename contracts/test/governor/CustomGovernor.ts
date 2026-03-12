import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

async function deployFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const governanceToken = await ethers.deployContract("GovernanceToken");
    const SsdlabToken = await ethers.deployContract("SsdlabToken", [owner.address]);
    const CustomGovernor = await ethers.deployContract("CustomGovernor", [governanceToken.target, SsdlabToken.target]);
    return { governanceToken, CustomGovernor, SsdlabToken, owner, addr1, addr2, addr3 };
}

describe("CustomGovernor Contract", function () {
    it("投票結果確定後に賛成多数の場合投票したユーザー全員に対してNFT配布が行われる", async function () {
        const { governanceToken, CustomGovernor, SsdlabToken, owner, addr1, addr2, addr3 } = await deployFixture();

        // 投票に必要なトークンのミントして投票権を委譲する
        const mintAmount = ethers.parseEther("1");
        const addrList = [addr1, addr2, addr3];
        for (const addr of addrList) {
            await governanceToken.mint(addr.address, mintAmount);
            await governanceToken.connect(addr).delegate(addr.address);
        }

        // 提案作成
        const target = SsdlabToken.target; // ターゲットコントラクトのアドレス
        const value = 0; // 送金するETHの量
        const data = SsdlabToken.interface.encodeFunctionData("safeMint", [owner.address, "Test NFT"]);
        const description = "Ownerからaddr1に10個のSsdlabTokenを送金する"; // 提案の説明
        const proposalUri = "ipfs://test-proposal"; // 提案のメタデータ
        await CustomGovernor.proposeAction([target], [value], [data], description, proposalUri);

        // 提案IDを求める
        const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
        const proposalId = await CustomGovernor.hashProposal([target], [value], [data], descriptionHash);

        // 投票開始ブロックになるまでマイニング
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする

        // 提案IDを求め、投票を行う
        for (const addr of addrList) {
            await CustomGovernor.connect(addr).castVote(proposalId, 1); // 1は賛成票を表す
        }

        // 投票期間終了後にブロックをマイニングして投票結果を確定させる
        await ethers.provider.send("evm_mine", []);
        await ethers.provider.send("evm_mine", []);
        await ethers.provider.send("evm_mine", []);

        // 投票結果を確認
        const votingState = await CustomGovernor.state(proposalId);
        expect(votingState).to.equal(4n); // 投票結果確定状態を確認(4はSucceededを表す)

        // 投票作成時の定義した提案を実行する(投票作成時と同じ引数が必須)
        await CustomGovernor.connect(owner).execute([target], [value], [data], ethers.keccak256(ethers.toUtf8Bytes(description))); // 提案を実行する

        // 投票結果確定後にNFTを転送しまとめて所有者が変更されていることを確認
        for (let i = 0; i < addrList.length; i++) {
            const ownerOfNFT = await SsdlabToken.ownerOf(i+1); // 提案の0を抜かしたトークンID 1から順に確認
            expect(ownerOfNFT).to.equal(addrList[i].address);
        }
    });

    it("投票結果確定後に反対多数の場合NFT配布が行われない", async function () {
        const { governanceToken, CustomGovernor, SsdlabToken, owner, addr1, addr2, addr3 } = await deployFixture();

        // 投票に必要なトークンのミントして投票権を委譲する
        const mintAmount = ethers.parseEther("1");
        const addrList = [addr1, addr2, addr3];
        for (const addr of addrList) {
            await governanceToken.mint(addr.address, mintAmount);
            await governanceToken.connect(addr).delegate(addr.address);
        }

        // NFTのミント
        await SsdlabToken.safeMint(owner.address, "Test NFT"); // まずはownerにNFTをミントしておく
        await SsdlabToken.setApprovalForAll(CustomGovernor.target, true); // CustomGovernorコントラクトにNFTの転送を許可する
        const ownerOfNFTBefore = await SsdlabToken.ownerOf(0); // トークンID 0の所有者を取得
        expect(ownerOfNFTBefore).to.equal(owner.address); // NFTがownerにあることを確認

        // 提案作成
        const target = SsdlabToken.target; // ターゲットコントラクトのアドレス
        const value = 0; // 送金するETHの量
        const data = SsdlabToken.interface.encodeFunctionData("safeMint", [addr1.address, "Test NFT for addr1"]); // コールデータ（例: NFTを転送する） 
        const description = "Ownerからaddr1に10個のSsdlabTokenを送金する"; // 提案の説明
        const proposalUri = "ipfs://test-proposal"; // 提案のメタデータ
        await CustomGovernor.proposeAction([target], [value], [data], description, proposalUri);

        // 提案IDを求める
        const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
        const proposalId = await CustomGovernor.hashProposal([target], [value], [data], descriptionHash);

        // 投票開始ブロックになるまでマイニング
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする

        // 提案IDを求め、投票を行う
        for (const addr of addrList) {
            await CustomGovernor.connect(addr).castVote(proposalId, 0); // 0は反対票を表す
        }

        // 投票期間終了後にブロックをマイニングして投票結果を確定させる
        await ethers.provider.send("evm_mine", []);
        await ethers.provider.send("evm_mine", []);
        await ethers.provider.send("evm_mine", []);
        
        // 投票結果を確認
        const votingState = await CustomGovernor.state(proposalId);
        expect(votingState).to.equal(3n); // 投票結果確定状態を確認(3はDefeatedを表す)

        // 提案を実行しようとするが、投票結果が反対多数のため失敗することを確認
        await expect(CustomGovernor.execute([target], [value], [data], descriptionHash))
            .to.be.revertedWithCustomError(CustomGovernor, "GovernorUnexpectedProposalState");

        // 投票結果確定後にNFTが転送されていないことを確認
        for (let i = 0; i < addrList.length; i++) {
            const ownerOfNFT = await SsdlabToken.ownerOf(0);
            expect(ownerOfNFT).to.equal(owner.address);
        }
    });
});
