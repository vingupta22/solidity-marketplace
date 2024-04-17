
const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const MINIMUM_BID = 3;
const INITIAL_BID_VALUE = 10;
const MAX_BID = 100;
const DURATION = 86400;

describe("Auction", function () {
    
    async function deployFixture() {
      
      // Contracts are deployed using the first signer/account by default
      const [beneficiary, otherAccount, otherAccount2] = await ethers.getSigners();
  
      const AuctionFactory = await ethers.getContractFactory("Auction");
      const contract = await AuctionFactory.deploy(MINIMUM_BID, MAX_BID, DURATION, beneficiary.address);
  
      return { contract, beneficiary, otherAccount, otherAccount2 };
    }

    async function bidAlreadySubmittedFixture() {
        const { contract, beneficiary, otherAccount, otherAccount2} = await loadFixture(deployFixture)

        await contract.connect(otherAccount).bid( {value: INITIAL_BID_VALUE})

        return {contract, beneficiary, otherAccount, otherAccount2 }
    }

    async function auctionEndedFixture() {
        const { contract, beneficiary, otherAccount, otherAccount2} = await loadFixture(bidAlreadySubmittedFixture)

        await contract.connect(beneficiary).settleAuction()

        return {contract, beneficiary, otherAccount, otherAccount2 }
    }

    

    describe("Bid - 60 points", function () {
        it("Should not allow the current maxBidder to bid again (+6 points)", async function() {
            const { contract, beneficiary, otherAccount, otherAccount2} = await loadFixture(bidAlreadySubmittedFixture)
            await expect(contract.connect(otherAccount).bid( {value: INITIAL_BID_VALUE + 1})).to.be.reverted

        })
        it("Should fail if the value sent is not greater than the required minimum bid (+6 points)", async function() {
            const { contract, beneficiary, otherAccount, otherAccount2} = await loadFixture(bidAlreadySubmittedFixture)
            let bid = (await contract.minimumBid()) - BigInt(1)
            await expect(contract.connect(otherAccount).bid( {value: bid})).to.be.reverted

        })
        it("Should not allow bids if the auction has already ended (+6 points)", async function() {
            const { contract, beneficiary, otherAccount, otherAccount2} = await loadFixture(auctionEndedFixture)
            await expect(contract.connect(otherAccount2).bid( {value: INITIAL_BID_VALUE + 1})).to.be.reverted

        })
        it("Should not transfer any funds if bid is called the first time (+6 points)", async function() {
            const { contract, beneficiary, otherAccount, otherAccount2} = await loadFixture(deployFixture)

            await expect(contract.connect(otherAccount).bid({value: INITIAL_BID_VALUE})).to.changeEtherBalances(
                [contract.target, otherAccount, ethers.ZeroAddress],
                [INITIAL_BID_VALUE, -INITIAL_BID_VALUE, 0]
            );
        })
        it("Should transfer funds if bid is called and conditions satisfied (+10 points)", async function() {
            const { contract, beneficiary, otherAccount, otherAccount2} = await loadFixture(bidAlreadySubmittedFixture)

            await expect(contract.connect(otherAccount2).bid({value: INITIAL_BID_VALUE + 1})).to.changeEtherBalances(
                [contract.target, otherAccount2, otherAccount],
                [1, -INITIAL_BID_VALUE - 1, INITIAL_BID_VALUE]
            );
        })
        it("Should set minimumBid and maxBidder to new values after a bid (+6 points)", async function() {
            const { contract, beneficiary, otherAccount, otherAccount2} = await loadFixture(bidAlreadySubmittedFixture)
            let contractMinimumBid = await contract.minimumBid()
            let contractMaxBidder = await contract.maxBidder()

            expect(contractMaxBidder).to.equal(otherAccount)
            expect(contractMinimumBid).to.equal(INITIAL_BID_VALUE)
        })

        // New test case for instant buy
        it("Should instantly settle auction if a bid matches the max price (+8 points)", async function() {
            const { contract, beneficiary, otherAccount, otherAccount2 } = await loadFixture(deployFixture);

            // Bid the maximum price
            await contract.connect(otherAccount).bid({ value: MAX_BID });

            // Check if the auction is instantly settled
            const auctionEnded = await contract.auctionEnded();
            const instantBuy = await contract.instantBuy();
             const maxBidder = await contract.maxBidder();

            // Verify the auction is instantly settled
            expect(auctionEnded).to.equal(true);
            expect(instantBuy).to.equal(true);
            expect(maxBidder).to.equal(otherAccount.address);


        });

        // New test case for incremental bidding
        it("Should fail if the value sent doesn't meet the increment requirement (+6 points)", async function() {
            const { contract, beneficiary, otherAccount, otherAccount2 } = await loadFixture(bidAlreadySubmittedFixture);
            let bid = parseInt(await contract.minimumBid()) - 1; // Less than required increment
            await expect(contract.connect(otherAccount).bid({ value: bid })).to.be.reverted;
        });

        // New test case for time limit
        it("Should end the auction automatically when the time limit is reached (+6 points)", async function() {
            const { contract, beneficiary, otherAccount, otherAccount2 } = await loadFixture(deployFixture);
            // Fast-forward to after the auction end time
            // time travel EC
            await ethers.provider.send("evm_increaseTime", [DURATION]);
            await ethers.provider.send("evm_mine");

            let contractAuctionEnded = await contract.auctionEnded();
            expect(contractAuctionEnded).to.equal(true);
        });

        // New test case to ensure bids are rejected after auction end
        it("Should reject bids after the auction has ended (+6 points)", async function() {
            const { contract, beneficiary, otherAccount, otherAccount2 } = await loadFixture(auctionEndedFixture);
            await expect(contract.connect(otherAccount2).bid({ value: INITIAL_BID_VALUE + 1 })).to.be.reverted;
        });
    })
})