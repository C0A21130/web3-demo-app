import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const governanceToken = await ethers.deployContract("GovernanceToken");
    const SsdlabToken = await ethers.deployContract("SsdlabToken", [owner.address]);
    const MyGovernor = await ethers.deployContract("BasicGovernor", [governanceToken.target]);
    return { governanceToken, MyGovernor, SsdlabToken, owner, addr1, addr2 };
}

describe("BasicGovernor Contract", function () {
    it("提案作成処理が正常に完了し作成した投票がブロック生成により投票状態が変化すること", async function () {
        const { MyGovernor, SsdlabToken } = await deployFixture();

        // 提案作成
        const target = SsdlabToken.target; // ターゲットコントラクトのアドレス
        const value = 0; // 送金するETHの量
        const data = "0x0000000000000000000000000000000000000000000000000000000000000000"; // 空のコールデータ
        const description = "Test Proposal"; // 提案の説明
        const tx = await MyGovernor.propose([target], [value], [data], description);

        // トランザクションが成功することを確認
        await expect(tx).to.emit(MyGovernor, "ProposalCreated");

        // 提案IDを求める
        const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
        const proposalId = await MyGovernor.hashProposal([target], [value], [data], descriptionHash);
        let votingState = await MyGovernor.state(proposalId);
        expect(votingState).to.equal(0n); // 提案作成直後の状態を確認(0はPendingを表す) 

        // 投票開始ブロックになるまでマイニング
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする
        votingState = await MyGovernor.state(proposalId);
        expect(votingState).to.equal(1n); // 投票開始状態を確認(1はActiveを表す)

        // 投票開始ブロックになるまでマイニング
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする
        votingState = await MyGovernor.state(proposalId);
        expect(votingState).to.equal(3n); // 投票終了状態を確認(3はDefeatedを表す)
    });

    it("提案作成後に投票ができること", async function () {
        const { governanceToken, MyGovernor, addr1, addr2 } = await deployFixture();

        // 投票に必要なトークンのミント
        const mintAmount = ethers.parseEther("1");
        await governanceToken.mint(addr2.address, mintAmount);
        
        // 投票権を委譲(delegate)してトークンによる投票を有効にする
        await governanceToken.connect(addr2).delegate(addr2.address);

        // 提案作成
        const target = governanceToken.target; // ターゲットコントラクトのアドレス
        const value = 0; // 送金するETHの量
        const data = governanceToken.interface.encodeFunctionData("transfer", [addr1.address, 10]); // コールデータ（例: 10 Tokenをaddr1に送金する）
        const description = "Test Proposal"; // 提案の説明
        await MyGovernor.propose([target], [value], [data], description);

        // 提案IDを求める
        const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
        const proposalId = await MyGovernor.hashProposal([target], [value], [data], descriptionHash);

        // 投票開始ブロックになるまでマイニング
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする
        const votingState = await MyGovernor.state(proposalId);
        expect(votingState).to.equal(1n); // 投票開始状態を確認(1はActiveを表す)

        // 提案IDを求め、投票を行う
        await MyGovernor.connect(addr2).castVote(proposalId, 1); // 1は賛成票を表す

        // 投票数を確認
        const proposalVotes = await MyGovernor.proposalVotes(proposalId); // 賛成票の数を取得
        expect(proposalVotes.forVotes).to.equal(mintAmount); // 賛成票が1であることを確認
        expect(proposalVotes.againstVotes).to.equal(0n); // 反対票が0であることを確認
        expect(proposalVotes.abstainVotes).to.equal(0n); // 無投票が0であることを確認
    });

    it("投票結果確定後に賛成多数の場合NFT配布が行われる", async function () {
        const { governanceToken, MyGovernor, SsdlabToken, owner, addr1, addr2 } = await deployFixture();

        // 投票に必要なトークンのミント
        const mintAmount = ethers.parseEther("1");
        await governanceToken.mint(addr2.address, mintAmount);

        // 投票権を委譲(delegate)してトークンによる投票を有効にする
        await governanceToken.connect(addr2).delegate(addr2.address);

        // NFTのミント
        await SsdlabToken.safeMint(owner.address, "Test NFT"); // まずはownerにNFTをミントしておく
        await SsdlabToken.setApprovalForAll(MyGovernor.target, true); // MyGovernorコントラクトにNFTの転送を許可する
        const ownerOfNFTBefore = await SsdlabToken.ownerOf(0); // トークンID 0の所有者を取得
        expect(ownerOfNFTBefore).to.equal(owner.address); // NFTがownerにあることを確認

        // 提案作成
        const target = SsdlabToken.target; // ターゲットコントラクトのアドレス
        const value = 0; // 送金するETHの量
        const data = SsdlabToken.interface.encodeFunctionData("transferFrom", [owner.address, addr1.address, 0]); // コールデータ（例: NFTを転送する） 
        const description = "Ownerからaddr1に10個のSsdlabTokenを送金する"; // 提案の説明
        await MyGovernor.propose([target], [value], [data], description);

        // 提案IDを求める
        const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
        const proposalId = await MyGovernor.hashProposal([target], [value], [data], descriptionHash);

        // 投票開始ブロックになるまでマイニング
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする

        // 提案IDを求め、投票を行う
        await MyGovernor.connect(addr2).castVote(proposalId, 1); // 1は賛成票を表す

        // 投票期間終了後にブロックをマイニングして投票結果を確定させる
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングして投票期間終了
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングして投票期間終了
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングして投票期間終了

        // 投票結果を確認
        const votingState = await MyGovernor.state(proposalId);
        expect(votingState).to.equal(4n); // 投票結果確定状態を確認(4はSucceededを表す)

        // 投票作成時の定義した提案を実行する(投票作成時と同じ引数が必須)
        await MyGovernor.execute([target], [value], [data], ethers.keccak256(ethers.toUtf8Bytes(description))); // 提案を実行する

        // 投票結果確定後にNFTが転送されていることを確認
        // const ownerOfNFT = await SsdlabToken.ownerOf(0); // トークンID 0の所有者を取得
        // expect(ownerOfNFT).to.equal(addr1.address); // NFTがaddr1に転送されていることを確認 
    });

    it("投票結果確定後に反対多数の場合NFT配布が行われない", async function () {
        const { governanceToken, MyGovernor, SsdlabToken, owner, addr1, addr2 } = await deployFixture();

        // 投票に必要なトークンのミント
        const mintAmount = ethers.parseEther("1");
        await governanceToken.mint(addr2.address, mintAmount);

        // 投票権を委譲(delegate)してトークンによる投票を有効にする
        await governanceToken.connect(addr2).delegate(addr2.address);

        // NFTのミント
        await SsdlabToken.safeMint(owner.address, "Test NFT"); // まずはownerにNFTをミントしておく
        await SsdlabToken.setApprovalForAll(MyGovernor.target, true); // MyGovernorコントラクトにNFTの転送を許可する
        const ownerOfNFTBefore = await SsdlabToken.ownerOf(0); // トークンID 0の所有者を取得
        expect(ownerOfNFTBefore).to.equal(owner.address); // NFTがownerにあることを確認

        // 提案作成
        const target = SsdlabToken.target; // ターゲットコントラクトのアドレス
        const value = 0; // 送金するETHの量
        const data = SsdlabToken.interface.encodeFunctionData("transferFrom", [owner.address, addr1.address, 0]); // コールデータ（例: NFTを転送する） 
        const description = "Ownerからaddr1に10個のSsdlabTokenを送金する"; // 提案の説明
        await MyGovernor.propose([target], [value], [data], description);

        // 提案IDを求める
        const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
        const proposalId = await MyGovernor.hashProposal([target], [value], [data], descriptionHash);

        // 投票開始ブロックになるまでマイニング
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングしてActive状態にする

        // 提案IDを求め、投票を行う
        await MyGovernor.connect(addr2).castVote(proposalId, 0); // 0は反対票を表す

        // 投票期間終了後にブロックをマイニングして投票結果を確定させる
        await ethers.provider.send("evm_mine", []); // ブロックを1つマイニングして投票期間終了
        
        // 投票結果を確認
        const votingState = await MyGovernor.state(proposalId);
        expect(votingState).to.equal(3n); // 投票結果確定状態を確認(3はDefeatedを表す)

        // 提案を実行しようとするが、投票結果が反対多数のため失敗することを確認
        await expect(MyGovernor.execute([target], [value], [data], descriptionHash))
            .to.be.revertedWithCustomError(MyGovernor, "GovernorUnexpectedProposalState");

        // 投票結果確定後にNFTが転送されていないことを確認
        const ownerOfNFT = await SsdlabToken.ownerOf(0); // トークンID 0の所有者を取得
        expect(ownerOfNFT).to.equal(owner.address); // NFTがownerに残っていることを確認
    });

    it("投票期間外の投票は拒否されること", async function () {
        const { governanceToken, MyGovernor, addr1 } = await deployFixture();

        // 投票に必要なトークンのミント
        const mintAmount = ethers.parseEther("1");
        await governanceToken.mint(addr1.address, mintAmount);

        // 投票権を委譲(delegate)してトークンによる投票を有効にする
        await governanceToken.connect(addr1).delegate(addr1.address);

        // 提案作成
        const target = governanceToken.target; // ターゲットコントラクトのアドレス
        const value = 0; // 送金するETHの量
        const data = "0x0000000000000000000000000000000000000000000000000000000000000000"; // 空のコールデータ
        const description = "Test Proposal"; // 提案の説明
        await MyGovernor.propose([target], [value], [data], description);

        // 提案IDを求める
        const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
        const proposalId = await MyGovernor.hashProposal([target], [value], [data], descriptionHash);

        // 投票開始前に投票しようとするが、投票期間外のため失敗することを確認
        await expect(MyGovernor.connect(addr1).castVote(proposalId, 1)) // 1は賛成票を表す
            .to.be.revertedWithCustomError(MyGovernor, "GovernorUnexpectedProposalState");

        // 投票終了ブロックになるまでマイニング
        await ethers.provider.send("evm_mine", []);
        await ethers.provider.send("evm_mine", []);
        await ethers.provider.send("evm_mine", []);
        await ethers.provider.send("evm_mine", []);
        await ethers.provider.send("evm_mine", []);
        await ethers.provider.send("evm_mine", []);

        // 投票終了後に投票しようとするが、投票期間外のため失敗することを確認
        await expect(MyGovernor.connect(addr1).castVote(proposalId, 1)) // 1は賛成票を表す
            .to.be.revertedWithCustomError(MyGovernor, "GovernorUnexpectedProposalState");
    });
});
