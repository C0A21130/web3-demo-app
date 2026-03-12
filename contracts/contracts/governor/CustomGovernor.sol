// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.5.0
pragma solidity ^0.8.27;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

interface ISsdlabToken {
    function batchTransfer(address[] memory toList, string memory _tokenName) external;
}

contract CustomGovernor is Governor, GovernorCountingSimple, GovernorVotes {
    mapping(uint256 => string) public proposalUris;
    mapping(uint256 => address[]) public forVoteUsers;

    event ProposalMaterialURISet(uint256 indexed proposalId, string materialURI);

    ISsdlabToken public ssdlabToken;

    constructor(IVotes _token, ISsdlabToken _ssdlabToken) Governor("MyGovernor") GovernorVotes(_token) {
        ssdlabToken = _ssdlabToken;
    }

    /// @dev 提案を作成する関数。提案の内容と説明、そして提案資料のURIを引数に取る。
    /// @param target コントラクトのアドレスのリスト
    /// @param value 各コントラクトに送るETHの量のリスト
    /// @param callData 各コントラクトに送る関数呼び出しデータのリスト
    /// @param description 提案の説明
    /// @param proposalURI 提案資料のURI
    function proposeAction(
        address[] memory target,
        uint256[] memory value,
        bytes[] memory callData,
        string memory description,
        string memory proposalURI
    ) external returns (uint256) {
        uint256 proposalId = propose(target, value, callData, description);
        proposalUris[proposalId] = proposalURI;
        emit ProposalMaterialURISet(proposalId, proposalURI);
        return proposalId;
    }

    /// @dev 提案資料のURIを取得する関数
    /// @param proposalId 提案のID
    /// @return proposalURI 提案資料のURI
    function getProposalURI(uint256 proposalId) public view returns (string memory) {
        return proposalUris[proposalId];
    }

    /// @dev 投票を行う関数。投票の賛成/反対を引数に取る。
    /// @param proposalId 投票する提案のID
    /// @param support 投票の賛成/反対 (0 = 反対, 1 = 賛成, 2 = 棄権)
    /// @return voteId 投票のID
    function castVote(uint256 proposalId, uint8 support) public override returns (uint256) {
        uint256 voteId = super.castVote(proposalId, support);
        if (support == 1) {
            forVoteUsers[proposalId].push(msg.sender);
        }
        return voteId;
    }

    /// @dev 投票期間終了後に提案内容を実行する関数
    /// @param target コントラクトのアドレスのリスト
    /// @param value 各コントラクトに送るETHの量のリスト
    /// @param callData 各コントラクトに送る関数呼び出しデータのリスト
    /// @param descriptionHash 提案の説明のハッシュ
    /// @return proposalId 実行された提案のID
    function execute(
        address[] memory target,
        uint256[] memory value,
        bytes[] memory callData,
        bytes32 descriptionHash
    ) public payable override returns (uint256) {
        uint256 proposalId = super.execute(target, value, callData, descriptionHash);
        ssdlabToken.batchTransfer(forVoteUsers[proposalId], "Test Token");
        return proposalId;
    }

    /// @dev 投票開始までの遅延時間を設定
    function votingDelay() public pure override returns (uint256) {
        return 2; // 2ブロック * 約15秒 = 約30秒
    }

    /// @dev 投票期間を設定
    function votingPeriod() public pure override returns (uint256) {
        return 5; // 5ブロック * 約15秒 = 約75秒
    }

    /// @dev 投票のクォーラム(最適投票数)を設定
    function quorum(uint256) public pure override returns (uint256) {
        return 1e18; // 1 token
    }
}
