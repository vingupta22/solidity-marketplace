const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("AssetFactory", function() {

    
    async function deployFixture() {
        // Contracts are deployed using the first signer/account by default
        const [account, account2, account3] = await ethers.getSigners();
    
        const contractFactory = await ethers.getContractFactory("AssetFactoryExposed");
        const contract = await contractFactory.deploy();
    
        return { contract, account, account2, account3 };
    }

    async function digitalAssetsExistFixture() {
        const {contract, account, account2, account3} = await loadFixture(deployFixture)
        await contract.connect(account).mint("Test1");
        await contract.connect(account2).mint("Test2");
        await contract.connect(account3).mint("Test3");
        await contract.connect(account2).mint("Test4");
        await contract.connect(account).mint("Test5");
        return {contract, account, account2, account3}
    }
    describe("Mint - 25 points", function () {
        it("Should not accept a name greater than 31 bytes (+5 points)", async function() {
            const {contract, account, account2} = await loadFixture(deployFixture)

            await expect(contract.mint("AHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH")).to.be.reverted
        })
        it("Should add DigitalAsset to digitalAssets array (+15 points)", async function() {
            const {contract, account, account2} = await loadFixture(deployFixture)
            let assetName = "Test"
            await contract.mint(assetName)
            let asset = await contract.digitalAssets(0)
            expect(asset[0]).to.equal(assetName)
            expect(asset[1]).to.equal(account)
        })
        it("Should increment assetCounter by 1 after successful mint (+5 points)", async function() {
            const {contract, account, account2} = await loadFixture(deployFixture)
            let assetName = "Test"
            await contract.mint(assetName)
            let contractAssetCounter = await contract.assetCounter()
            expect(contractAssetCounter).to.equal(1)
        })
    })

    describe("transferTo - 25 points", function () {
        it("Should fail if the assetID is invalid (+5 points)", async function() {
            const {contract, account, account2, account3} = await loadFixture(digitalAssetsExistFixture)
            await expect(contract.connect(account).transferTo(account2, 10)).to.be.reverted
        })            
        it("Should fail if transaction sender is not owner (+5 points)", async function() {
            const {contract, account, account2, account3} = await loadFixture(digitalAssetsExistFixture)
            await expect(contract.connect(account2).transferTo(account3, 0)).to.be.reverted
        })
        it("Should transfer asset to proper owner (+15 points)", async function() {
            const {contract, account, account2, account3} = await loadFixture(digitalAssetsExistFixture)
            await contract.connect(account).transferTo(account2, 0)
            let asset = await contract.digitalAssets(0)
            expect(asset.owner).to.equal(account2)
        })
    })

    describe("editName - 25 points", function () {
        it("Should fail if the assetID is invalid (+5 points)", async function() {
            const {contract, account, account2, account3} = await loadFixture(digitalAssetsExistFixture)
            await expect(contract.connect(account3).editName(10, "Test10")).to.be.reverted
        })            
        it("Should fail if transaction sender is not owner (+5 points)", async function() {
            const {contract, account, account2, account3} = await loadFixture(digitalAssetsExistFixture)
            await expect(contract.connect(account2).editName(2, "Test10")).to.be.reverted
        })
        it("Should not accept a name greater than 31 bytes (+5 points)", async function() {
            const {contract, account, account2, account3} = await loadFixture(digitalAssetsExistFixture)

            await expect(contract.connect(account3).editName(2, "AHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH")).to.be.reverted
        })
        it("Should change the name of the asset if the conditions are satisfied (+10 points)", async function() {
            const {contract, account, account2, account3} = await loadFixture(digitalAssetsExistFixture)
            await contract.connect(account3).editName(2, "Test10")
            let asset = await contract.digitalAssets(2)
            expect(asset.name).to.equal("Test10")
        })
    })

    describe("ownerOf - 25 points", function() {
        it("Should fail if the assetID is invalid (+10 points)", async function() {
            const {contract, account, account2, account3} = await loadFixture(digitalAssetsExistFixture)
            await expect(contract._ownerOf(10)).to.be.reverted
        }) 
        it("Should return the owner of the asset (+15 points)", async function() {
            const {contract, account, account2, account3} = await loadFixture(digitalAssetsExistFixture)
            expect(await contract._ownerOf(0)).to.equal(account)
            expect(await contract._ownerOf(1)).to.equal(account2)
            expect(await contract._ownerOf(2)).to.equal(account3)
            expect(await contract._ownerOf(3)).to.equal(account2)
            expect(await contract._ownerOf(4)).to.equal(account)
        })  
    })

    describe("assetsOf - 25 points", function() {
        it("Should return the correct assetIDs for each owner (+25 points)", async function() {
            const {contract, account, account2, account3} = await loadFixture(digitalAssetsExistFixture)
            let ownerAssets1 = await contract.assetsOf(account)
            expect(ownerAssets1[0]).to.equal(0)
            expect(ownerAssets1[1]).to.equal(4)
            let ownerAssets2 = await contract.assetsOf(account2)
            expect(ownerAssets2[0]).to.equal(1)
            expect(ownerAssets2[1]).to.equal(3)
            let ownerAssets3 = await contract.assetsOf(account3)
            expect(ownerAssets3[0]).to.equal(2)
            
            //returns an array of 0's, which could confuse the user into thinking zero address owns zero id
            //may be explained in class
            // let ownerAssets4 = await contract.assetsOf(ethers.ZeroAddress)
            // expect(ownerAssets4[0]).to.equal(0)
        })
    })

})
