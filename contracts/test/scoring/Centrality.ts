import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Centrality } from "../../typechain-types";

async function deployFixture() {
  const [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
  const Centrality = await ethers.deployContract("Centrality", []);
  return { Centrality, owner, addr1, addr2, addr3, addr4, addr5 };
}

describe("Centrality Contract", function () {
  describe("デプロイメント", function () {
    it("コントラクトが正しくデプロイされること", async function () {
      const { Centrality } = await loadFixture(deployFixture);
      expect(Centrality).to.exist;
      expect(await Centrality.getUserCount()).to.equal(0);
    });
  });

  describe("頂点（ユーザー）管理", function () {
    it("新しいユーザーを追加できること", async function () {
      const { Centrality, addr1 } = await loadFixture(deployFixture);

      await expect(Centrality.addVertex(addr1.address))
        .to.emit(Centrality, "UserAdded")
        .withArgs(addr1.address);

      expect(await Centrality.vertexExists(addr1.address)).to.be.true;
      expect(await Centrality.getUserCount()).to.equal(1);
    });

    it("ゼロアドレスの追加を拒否すること", async function () {
      const { Centrality } = await loadFixture(deployFixture);

      await expect(Centrality.addVertex(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid user address");
    });

    it("重複したユーザーの追加を無視すること", async function () {
      const { Centrality, addr1 } = await loadFixture(deployFixture);

      await Centrality.addVertex(addr1.address);
      
      // 重複追加は例外をスローせず、無視される
      await expect(Centrality.addVertex(addr1.address))
        .to.not.emit(Centrality, "UserAdded");
      
      // ユーザー数は1のまま
      expect(await Centrality.getUserCount()).to.equal(1);
    });
  });

  describe("辺（接続）管理", function () {
    it("ユーザー間の接続を追加できること", async function () {
      const { Centrality, addr1, addr2 } = await loadFixture(deployFixture);

      await expect(Centrality.addEdge(addr1.address, addr2.address))
        .to.emit(Centrality, "UserAdded")
        .withArgs(addr1.address)
        .and.to.emit(Centrality, "UserAdded")
        .withArgs(addr2.address)
        .and.to.emit(Centrality, "ConnectionAdded")
        .withArgs(addr1.address, addr2.address);

      expect(await Centrality.isConnected(addr1.address, addr2.address)).to.be.true;
      expect(await Centrality.isConnected(addr2.address, addr1.address)).to.be.true;
    });

    it("自己ループを拒否すること", async function () {
      const { Centrality, addr1 } = await loadFixture(deployFixture);

      await expect(Centrality.addEdge(addr1.address, addr1.address))
        .to.be.revertedWith("Self-connection not allowed");
    });

    it("ゼロアドレスとの接続を拒否すること", async function () {
      const { Centrality, addr1 } = await loadFixture(deployFixture);

      await expect(Centrality.addEdge(addr1.address, ethers.ZeroAddress))
        .to.be.revertedWith("Invalid user address");
    });

    it("重複した接続を無視すること", async function () {
      const { Centrality, addr1, addr2 } = await loadFixture(deployFixture);

      await Centrality.addEdge(addr1.address, addr2.address);
      
      // 重複接続は例外をスローせず、無視される
      await expect(Centrality.addEdge(addr1.address, addr2.address))
        .to.not.emit(Centrality, "ConnectionAdded");
      
      // 接続数は1のまま
      expect(await Centrality.getTotalConnections()).to.equal(1);
    });
  });

  describe("次数計算", function () {
    it("ユーザーの次数を正しく計算できること", async function () {
      const { Centrality, addr1, addr2, addr3 } = await loadFixture(deployFixture);

      await Centrality.addEdge(addr1.address, addr2.address);
      await Centrality.addEdge(addr1.address, addr3.address);

      expect(await Centrality.getDegree(addr1.address)).to.equal(2);
      expect(await Centrality.getDegree(addr2.address)).to.equal(1);
      expect(await Centrality.getDegree(addr3.address)).to.equal(1);
    });

    it("存在しないユーザーの次数取得時にエラーを返すこと", async function () {
      const { Centrality, addr1 } = await loadFixture(deployFixture);

      await expect(Centrality.getDegree(addr1.address))
        .to.be.revertedWith("User does not exist");
    });
  });

  describe("次数中心性計算", function () {
    it("線形グラフ（4ユーザー）の次数中心性を正しく計算できること", async function () {
      const { Centrality, addr1, addr2, addr3, addr4 } = await loadFixture(deployFixture);

      // A-B-C-D の線形グラフを作成
      await Centrality.addEdge(addr1.address, addr2.address);
      await Centrality.addEdge(addr2.address, addr3.address);
      await Centrality.addEdge(addr3.address, addr4.address);

      // 期待値: 次数中心性 = (次数 * 100) / (総ユーザー数 - 1)
      // addr1: 次数=1, 中心性=(1*100)/(4-1)=33
      // addr2: 次数=2, 中心性=(2*100)/(4-1)=66
      // addr3: 次数=2, 中心性=(2*100)/(4-1)=66
      // addr4: 次数=1, 中心性=(1*100)/(4-1)=33

      expect(await Centrality.calculateDegreeCentrality(addr1.address)).to.equal(33);
      expect(await Centrality.calculateDegreeCentrality(addr2.address)).to.equal(66);
      expect(await Centrality.calculateDegreeCentrality(addr3.address)).to.equal(66);
      expect(await Centrality.calculateDegreeCentrality(addr4.address)).to.equal(33);
    });

    it("完全グラフ（4ユーザー）の次数中心性を正しく計算できること", async function () {
      const { Centrality, addr1, addr2, addr3, addr4 } = await loadFixture(deployFixture);

      // 完全グラフを作成（全ユーザーが相互接続）
      await Centrality.addEdge(addr1.address, addr2.address);
      await Centrality.addEdge(addr1.address, addr3.address);
      await Centrality.addEdge(addr1.address, addr4.address);
      await Centrality.addEdge(addr2.address, addr3.address);
      await Centrality.addEdge(addr2.address, addr4.address);
      await Centrality.addEdge(addr3.address, addr4.address);

      // 全ユーザーの次数=3, 中心性=(3*100)/(4-1)=100 (100%)
      expect(await Centrality.calculateDegreeCentrality(addr1.address)).to.equal(100);
      expect(await Centrality.calculateDegreeCentrality(addr2.address)).to.equal(100);
      expect(await Centrality.calculateDegreeCentrality(addr3.address)).to.equal(100);
      expect(await Centrality.calculateDegreeCentrality(addr4.address)).to.equal(100);
    });

    it("星型グラフ（4ユーザー）の次数中心性を正しく計算できること", async function () {
      const { Centrality, addr1, addr2, addr3, addr4 } = await loadFixture(deployFixture);

      // 星型グラフを作成（addr1が中心）
      await Centrality.addEdge(addr1.address, addr2.address);
      await Centrality.addEdge(addr1.address, addr3.address);
      await Centrality.addEdge(addr1.address, addr4.address);

      // 中心ユーザー(addr1): 次数=3, 中心性=(3*100)/(4-1)=100
      // 周辺ユーザー: 次数=1, 中心性=(1*100)/(4-1)=33
      expect(await Centrality.calculateDegreeCentrality(addr1.address)).to.equal(100);
      expect(await Centrality.calculateDegreeCentrality(addr2.address)).to.equal(33);
      expect(await Centrality.calculateDegreeCentrality(addr3.address)).to.equal(33);
      expect(await Centrality.calculateDegreeCentrality(addr4.address)).to.equal(33);
    });

    it("単一ユーザーの場合に中心性0を返すこと", async function () {
      const { Centrality, addr1 } = await loadFixture(deployFixture);

      await Centrality.addVertex(addr1.address);
      expect(await Centrality.calculateDegreeCentrality(addr1.address)).to.equal(0);
    });

    it("全ユーザーの次数中心性を一括取得できること", async function () {
      const { Centrality, addr1, addr2, addr3 } = await loadFixture(deployFixture);

      await Centrality.addEdge(addr1.address, addr2.address);
      await Centrality.addEdge(addr2.address, addr3.address);

      const [users, centralities] = await Centrality.getAllDegreeCentralities();

      expect(users.length).to.equal(3);
      expect(centralities.length).to.equal(3);

      // ユーザーと中心性の対応を確認
      for (let i = 0; i < users.length; i++) {
        const expectedCentrality = await Centrality.calculateDegreeCentrality(users[i]);
        expect(centralities[i]).to.equal(expectedCentrality);
      }
    });
  });

  describe("補助関数", function () {
    it("ユーザーの接続相手を取得できること", async function () {
      const { Centrality, addr1, addr2, addr3 } = await loadFixture(deployFixture);

      await Centrality.addEdge(addr1.address, addr2.address);
      await Centrality.addEdge(addr1.address, addr3.address);

      const connections = await Centrality.getConnections(addr1.address);
      expect(connections.length).to.equal(2);
      expect(connections).to.include(addr2.address);
      expect(connections).to.include(addr3.address);
    });

    it("総接続数を正しく計算できること", async function () {
      const { Centrality, addr1, addr2, addr3 } = await loadFixture(deployFixture);

      await Centrality.addEdge(addr1.address, addr2.address);
      await Centrality.addEdge(addr2.address, addr3.address);

      expect(await Centrality.getTotalConnections()).to.equal(2);
    });

    it("全ユーザーリストを取得できること", async function () {
      const { Centrality, addr1, addr2, addr3 } = await loadFixture(deployFixture);

      await Centrality.addVertex(addr1.address);
      await Centrality.addVertex(addr2.address);
      await Centrality.addVertex(addr3.address);

      const allUsers = await Centrality.getAllUsers();
      expect(allUsers.length).to.equal(3);
      expect(allUsers).to.include(addr1.address);
      expect(allUsers).to.include(addr2.address);
      expect(allUsers).to.include(addr3.address);
    });
  });

  describe("大規模ネットワークテスト", function () {
    it("5ユーザーの複雑なネットワークで正しく動作すること", async function () {
      const { Centrality, addr1, addr2, addr3, addr4, addr5 } = await loadFixture(deployFixture);

      // 複雑なネットワークを作成
      await Centrality.addEdge(addr1.address, addr2.address);
      await Centrality.addEdge(addr1.address, addr3.address);
      await Centrality.addEdge(addr2.address, addr3.address);
      await Centrality.addEdge(addr2.address, addr4.address);
      await Centrality.addEdge(addr3.address, addr4.address);
      await Centrality.addEdge(addr4.address, addr5.address);

      // 各ユーザーの次数を確認
      expect(await Centrality.getDegree(addr1.address)).to.equal(2); // 次数2
      expect(await Centrality.getDegree(addr2.address)).to.equal(3); // 次数3
      expect(await Centrality.getDegree(addr3.address)).to.equal(3); // 次数3
      expect(await Centrality.getDegree(addr4.address)).to.equal(3); // 次数3
      expect(await Centrality.getDegree(addr5.address)).to.equal(1); // 次数1

      // 次数中心性を確認（1000倍, 総ユーザー数=5なので分母は4）
      expect(await Centrality.calculateDegreeCentrality(addr1.address)).to.equal(50); // (2*100)/4
      expect(await Centrality.calculateDegreeCentrality(addr2.address)).to.equal(75); // (3*100)/4
      expect(await Centrality.calculateDegreeCentrality(addr3.address)).to.equal(75); // (3*100)/4
      expect(await Centrality.calculateDegreeCentrality(addr4.address)).to.equal(75); // (3*100)/4
      expect(await Centrality.calculateDegreeCentrality(addr5.address)).to.equal(25); // (1*100)/4

      expect(await Centrality.getUserCount()).to.equal(5);
      expect(await Centrality.getTotalConnections()).to.equal(6);
    });
  });
});
