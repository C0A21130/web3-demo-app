// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.5.0
pragma solidity ^0.8.27;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

contract BasicGovernor is Governor, GovernorCountingSimple, GovernorVotes {

    constructor(IVotes _token) Governor("BasicGovernor") GovernorVotes(_token) {}

    /// @dev 投票開始までの遅延時間を設定
    function votingDelay() public pure override returns (uint256) {
        return 2; // 2ブロック * 約15秒 = 約30秒
    }

    /// @dev 投票期間を設定
    function votingPeriod() public pure override returns (uint256) {
        return 2; // 2ブロック * 約15秒 = 約30秒
    }

    /// @dev 投票のクォーラム(最適投票数)を設定
    function quorum(uint256) public pure override returns (uint256) {
        return 1e18; // 1 token
    }
}
