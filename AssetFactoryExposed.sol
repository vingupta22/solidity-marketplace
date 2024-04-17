// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Marketplace.sol";

contract AssetFactoryExposed is AssetFactory {
    function _ownerOf(uint256 tokenId) public view returns (address) {
        return ownerOf(tokenId); // This should work if AssetFactory has getOwnerOf and is a parent
    }
}
