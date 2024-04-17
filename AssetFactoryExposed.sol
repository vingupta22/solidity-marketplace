// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Marketplace.sol";

contract AssetFactoryExposed is AssetFactory {
    constructor(address _erc721Contract) AssetFactory(_erc721Contract) {}
    
    function _ownerOf(uint256 a) internal view returns (address) {
       return getOwnerOf(a);
    }
}