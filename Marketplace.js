const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const MINIMUM_BID = 10; // Minimum bid for auctions
const MAX_BID = 100; // Arbitrary maximum bid for test auctions
const AUCTION_DURATION = 60 * 60; // 1 hour in seconds, arbitrary duration

describe("Marketplace", function () {

    async function deployFixture() {
        const [account, account2, account3] = await ethers.getSigners();
        const MarketplaceFactory = await ethers.getContractFactory("MarketPlace");
        let contract = await MarketplaceFactory.deploy();
        return { contract, account, account2, account3 };
    }

    /* async function auctionExistsFixture() {
        const { contract, account } = await loadFixture(deployFixture);
        await contract.connect(account).mint("Test1");
        const assetId = 1; // Assuming `mint` increments an asset counter starting from 1
        await contract.connect(account).putForSale(MINIMUM_BID, MAX_BID, AUCTION_DURATION, assetId);
        return { contract, account };
    }*/ 

    async function auctionExistsFixture() {
        const { contract, account, account2, account3 } = await loadFixture(deployFixture)

        await contract.connect(account).mint("Test1");

        await contract.connect(account).putForSale(MINIMUM_BID, MAX_BID, AUCTION_DURATION, 0);

        return {contract, account, account2, account3};
    }

    describe("putForSale", function() {
        it("Should fail if the owner already has an auction", async function() {
            const { contract, account } = await loadFixture(auctionExistsFixture);
            const assetId = 0; // Referencing the same asset
            await expect(contract.connect(account).putForSale(MINIMUM_BID, MAX_BID, AUCTION_DURATION, assetId)).to.be.revertedWith("Already put an asset for sale.");
        });

        it("Should fail if the assetID is invalid", async function() {
            const { contract, account } = await loadFixture(deployFixture);
            const invalidAssetId = 999; // Assuming this ID has not been minted
            await expect(contract.connect(account).putForSale(MINIMUM_BID, MAX_BID, AUCTION_DURATION, invalidAssetId)).to.be.revertedWith("Asset does not exist.");
        });

        it("Should fail if the transaction sender is not the owner of the asset", async function() {
            const { contract, account, account2 } = await loadFixture(auctionExistsFixture);
            const assetId = 0; // Assuming `account` owns this asset
            await expect(contract.connect(account2).putForSale(MINIMUM_BID, MAX_BID, AUCTION_DURATION, assetId)).to.be.revertedWith("You are not the owner.");
        });

        it("Should increase auctionNumber by 1 after successful auction", async function() {
            const { contract } = await loadFixture(auctionExistsFixture);
            const auctionNumber = await contract.auctionNumber();
            expect(auctionNumber).to.equal(1);
        });

        it("Should set idToAuction mapping for auctionNumber", async function() {
            const { contract, account } = await loadFixture(auctionExistsFixture);
            const auctionContractAddress = await contract.idToAuction(1);
            const auctionContract = await hre.ethers.getContractAt("Auction", auctionContractAddress);
            const beneficiary = await auctionContract.beneficiary();
            expect(beneficiary).to.equal(account.address);
            const minimumBid = await auctionContract.minimumBid();
            expect(minimumBid).to.equal(MINIMUM_BID);
        });
    });

    // Additional tests for bidding and settling auctions
});

