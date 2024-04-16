// SPDX - License - Identifier : MIT
pragma solidity ^0.8.20;

/*
New feature possibilities for final: 
- Instant purchases of an item on the marketplace.
- Incremental bidding (bidders must raise by at least x percent)
- Time limit
*/


// Auction Contract
contract Auction {
    address payable public beneficiary ;
    uint256 public minimumBid ;
    uint256 public maxBid ; // This sets the maxiimum price for an item. If someone bids this amount, they own the item immediately.
    address public maxBidder;
    bool public auctionEnded;
    bool public instantBuy; // true if someone bids the max price;
    constructor ( uint256 _minimumBid , uint256 _maxBid, address payable _beneficiaryAddress ) {
        minimumBid = _minimumBid ;
        maxBid = _maxBid;
        beneficiary = _beneficiaryAddress ;
        maxBidder = address (0) ;
        auctionEnded = false ;
    }

    function settleAuction () external {
        if (instantBuy == false) {
            require ( msg . sender == beneficiary , " Only beneficiary can settle the auction .");
        }
        require (! auctionEnded , " Auction has already ended .") ;
        auctionEnded = true ;
        if ( maxBidder != address (0) ) {
            payable ( beneficiary ). transfer ( minimumBid );
        }
    }

     function instantSettle() internal {
        auctionEnded = true;
        maxBidder = msg.sender;
        payable(beneficiary).transfer(msg.value);
    }

    function bid () external payable {
        require ( msg . sender != maxBidder , " You are already the highest bidder .");
        require ( msg . value > minimumBid , " Bid amount too low .") ;
        require (! auctionEnded , " Auction has already ended .") ;
        require (msg.value <= maxBid, "Bid is more than the instant purchase price!");
        if (msg.value == maxBid) {
            instantSettle();
        }
        if ( maxBidder != address (0) ) {
            payable ( maxBidder ).transfer( minimumBid ) ;
        }
        minimumBid = msg . value ;
        maxBidder = msg . sender ;
    }
}

// AssetFactory Contract
contract AssetFactory {
    struct DigitalAsset {
        string name ;
        address owner ;
    }

    DigitalAsset [] public digitalAssets ;
    uint256 public assetCounter ;

    function mint ( string memory _name ) external {
        require ( bytes ( _name ) . length < 32 , " Name too long .") ;
        digitalAssets . push ( DigitalAsset (_name , msg . sender )) ;
        assetCounter ++;
    }

    function ownerOf ( uint256 _assetId ) internal view returns ( address ) {
        require ( _assetId < assetCounter , " Asset ID does not exist .");
        return digitalAssets [ _assetId ]. owner ;
    }

    function transferTo ( address _to , uint256 _assetId ) public {
        require ( _assetId < assetCounter , " Asset ID does not exist .");
        require ( msg . sender == ownerOf ( _assetId ) , " You are not the owner .");
        digitalAssets [ _assetId ].owner = _to;
    }

    function editName ( uint256 _assetId , string memory _name ) external {
        require ( _assetId < assetCounter , " Asset ID does not exist .");
        require ( msg . sender == ownerOf ( _assetId ) , " You are not the owner .");
        require ( bytes ( _name ) . length < 32 , " Name too long .") ;

        digitalAssets [ _assetId ].name = _name;
    }

    function assetsOf ( address _owner ) public view returns ( uint256 [] memory ) {
        uint256 [] memory ret = new uint256 []( assetCounter );
        uint256 counter = 0;
        for ( uint256 i = 0; i < assetCounter ; i ++) {
            if ( ownerOf (i) == _owner ) {
                ret [ counter ] = i;
                counter ++;
            }
        }
        return ret;
    }
}

// MarketPlace Contract
contract MarketPlace is AssetFactory {
    mapping ( address => uint256 ) public ownerToAuctionId ;
    mapping ( uint256 => Auction ) public idToAuction ;
    mapping ( uint256 => uint256 ) public auctionToObject ;
    uint256 public auctionNumber ;

    function putForSale ( uint256 _minimumBid , uint256 _maxBid, uint256 assetId ) public {
        require(assetId < assetCounter, "Asset does not exist.");
        require(msg.sender == ownerOf(assetId), "You are not the owner.");
        require(ownerToAuctionId[msg.sender] == 0, "Already put an asset for sale.");

        Auction newAuction = new Auction(_minimumBid, _maxBid, payable(msg.sender));
        auctionNumber++;
        ownerToAuctionId[msg.sender] = auctionNumber;
        idToAuction[auctionNumber] = newAuction;
        auctionToObject[auctionNumber] = assetId;
    }

    function bid ( uint256 auctionId ) public payable {
        require(auctionId <= auctionNumber && auctionId > 0, "Auction does not exist.");
        Auction auction = idToAuction[auctionId];
        auction.bid{value: msg.value}();
    }

    function settleAuction ( uint256 auctionId ) public {
        require(auctionId <= auctionNumber && auctionId > 0, "Auction does not exist.");
        Auction auction = idToAuction[auctionId];
        auction.settleAuction();
    }
}
