// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Centrality.sol";
import "./IERC4974.sol";

/**
 * @title Scoring
 * @dev 次数中心性を計算するスマートコントラクト
 * ユーザーアドレスを頂点として、ユーザー間の接続関係を管理し、次数中心性を算出する
 */
contract Scoring is Centrality, IERC4974 {
    mapping(address => bool) private operators;
    mapping(address => int8) private ratings;

    /// @dev See {IERC165-supportsInterface}.
    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return interfaceID == type(IERC165).interfaceId || interfaceID == type(IERC4974).interfaceId;
    }

    constructor(address _operator) {
        operators[_operator] = true;
        emit NewOperator(_operator);
    }

    modifier onlyOperator() {
        require(operators[msg.sender], "Caller is not the operator");
        _;
    }

    /// @dev See {IERC4974-setOperator}.
    function setOperator(address _operator) public onlyOperator {
        require(_operator != address(0), "Invalid operator address");
        require(!operators[_operator], "Operator already set");
        operators[_operator] = true;
        emit NewOperator(_operator);
    }

    /// @dev See {IERC4974-rate}.
    function rate(address _rated, int8 _rating) public onlyOperator {
        require(_rated != address(0), "Rated address cannot be zero");
        require(_rating >= -127 && _rating <= 127, "Rating must be between -127 and 127");
        int8 score = 0;
        if(_rating == -1){
            score = Centrality.calculateDegreeCentrality(_rated);
        } else {
            score = _rating;
        }
        ratings[_rated] = score;
        emit Rating(_rated, score);
    }

    /// @dev See {IERC4974-removeRating}.
    function removeRating(address _removed) public onlyOperator {
        require(_removed != address(0), "Removed address cannot be zero");
        delete ratings[_removed];
        emit Removal(_removed);
    }

    /// @dev See {IERC4974-ratingOf}.
    function ratingOf(address _rated) public view returns (int8) {
        return ratings[_rated];
    }

    function registScore(address _user) public onlyOperator {
        require(_user != address(0), "Invalid user address");

        int8 score = Centrality.calculateDegreeCentrality(_user);
        rate(_user, score);
    }
}
