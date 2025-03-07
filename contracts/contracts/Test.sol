// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Test {
    uint id = 1;
    
    function setId(uint _id) public {
        id = _id;
    }

    function getId() public view returns (uint) {
        return id;
    }
}
