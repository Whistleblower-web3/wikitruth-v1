const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { deployTruthBoxFixture} = require("./Fixture.js");
const {timestampToDate,secondsToDhms} = require('../utils/timeToDate.js');
const { Status } = require("./helpers.js");

/**
 * Test contract: TruthBox.sol
 * Main test content:
 * 1. Basic minting functionality
 * 2. Blacklist functionality
 * 3. Token transfer functionality
 * 4. Extend deadline
 * 5. Public operation functionality
 */

describe("TruthBox Contract Tests", function () {
  // Basic minting functionality tests
  describe("Basic Minting Functionality", function() {
    it("should correctly mint TruthBox and get Box information", async function () {
      // Test fixture initialization
      const { admin, minter, other, truthBox, truthNFT, bytes_mint, 
        truthBox_minter, truthBox_other, dao} = await loadFixture(deployTruthBoxFixture);
      
      // Fixture has already minted 5 tokens, verify initial state
      // Use truthNFT instead of truthBox to check token ownership
      expect(await truthNFT.ownerOf(0)).to.equal(minter.address);
      expect(await truthNFT.ownerOf(1)).to.equal(minter.address);
      
      // Mint another new token - note mint function only accepts three parameters
      await truthBox_minter.create(minter.address, "10_tokenURI", "10_infoURI", bytes_mint, 1000);
      
      // Get and verify Box information  TODO: This function is not needed for now
      // const boxInfo_0 = await truthBox.getBoxInfoCID(0);
      // expect(boxInfo_0).to.equal("00_infoURI");
      const [status_0, price_0, deadline_0, ] = await truthBox.getBasicData(0);
      const tokenURI_0 = await truthNFT.tokenURI(0);
      expect(tokenURI_0).to.equal('ipfs://00_tokenURIfleek.app');
      // expect(infoURI_0).to.equal("00_infoURI");
      expect(status_0).to.equal(Status.Storing);
    });
  });

  // Blacklist functionality tests
  describe("Blacklist Functionality", function() {
    it("add to blacklist-get info failed", async function () {
      // Test fixture initialization
      const { admin, minter, buyer, other, truthBox, truthNFT, bytes_mint, dao, truthBox_DAO,
        nft_DAO} = await loadFixture(deployTruthBoxFixture);
      
      // Add to blacklist - using DAO account
      await truthBox_DAO.addBoxToBlacklist(1);
      expect(await truthBox.isInBlacklist(1)).to.equal(true);
      
      // Tokens in blacklist should not be able to get information
      await expect(truthNFT.tokenURI(1))
        .to.be.revertedWithCustomError(truthNFT, "InBlacklist");
      
    });
    
    it("tokens in blacklist should not be able to perform other operations-transfer", async function () {
      const { truthBox, truthNFT, truthBox_minter, nft_DAO, minter,truthBox_DAO } = await loadFixture(deployTruthBoxFixture);
      
      // Add to blacklist - using DAO account
      await truthBox_DAO.addBoxToBlacklist(1);
      
      // Tokens in blacklist should not be able to approve transfer
      await expect(truthNFT.connect(minter).approve(truthBox.target, 1))
        .to.be.revertedWithCustomError(truthNFT, "InvalidStatus");
    });
  });

  it("10-blacklisted Token--buy/auction", async function () {
    const { minter, buyer, nft_DAO, truthBox, exchange, fundManager, truthBox_DAO,
      testToken, bytes32_1 , exchange_minter, exchange_buyer, address_zero,
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 1000);
    await truthBox_DAO.addBoxToBlacklist(1);
    await truthBox_DAO.addBoxToBlacklist(2);
    // ========================== Buy 1 ==========================
    // Should throw exception
    await expect(exchange_buyer.buy(1)).to.be.reverted;
    // 
    await expect(exchange_buyer.bid(2)).to.be.reverted;
  });

  // Token transfer tests
  describe("Token Transfer Functionality", function() {
    it("should correctly transfer token ownership only after transaction completion", async function () {
      const { admin, minter, other, exchange_minter, truthNFT, 
        truthBox_minter,exchange_buyer, address_zero 
      } = await loadFixture(deployTruthBoxFixture);
      // Complete transaction
      await exchange_minter.sell(2, address_zero, 2000);
      await exchange_buyer.buy(2);
      await exchange_buyer.completeOrder(2);

      // Approve and transfer token
      await truthNFT.connect(minter).approve(other.address, 2);
      await truthNFT.connect(other).transferFrom(minter.address, admin.address, 2);
      
      // Verify ownership change
      expect(await truthNFT.ownerOf(2)).to.equal(admin.address);
    });
    
    it("should not be able to transfer token ownership before transaction completion", async function () {
      const { buyer, truthBox, truthNFT, truthBox_DAO, nft_DAO, minter } = await loadFixture(deployTruthBoxFixture);
      
      // Add to blacklist - using DAO account
      await truthBox_DAO.addBoxToBlacklist(1);
      
      // Attempt to approve token in blacklist
      await expect(truthNFT.connect(minter).approve(buyer.address, 1))
        .to.be.revertedWithCustomError(truthNFT, "InvalidStatus");
    });
  });

  // Extend deadline
  describe("Extend deadline", function() {
    it("not expired, minter can extend deadline", async function () {
      const { truthBox_minter, truthBox ,minter,exchange_minter,truthBox_buyer} = await loadFixture(deployTruthBoxFixture);
      // First get deadline
      const deadline = Number(await truthBox.getDeadline(2));
      // Minter extends deadline
      await time.increase(340*24*60*60)
      await truthBox_minter.extendDeadline(2, 10000);
      const newDeadline = Number(await truthBox.getDeadline(2));
      // Verify if deadline is extended
      expect(newDeadline).to.equal(deadline + 10000);

      // Non-minter cannot extend deadline
      await expect(truthBox_buyer.extendDeadline(2, 10000))
        .to.be.revertedWithCustomError(truthBox, "InvalidCaller");
    });

    it("expired, minter cannot extend deadline", async function () {
      const { truthBox_minter, truthBox ,minter,exchange_minter,exchange_buyer} = await loadFixture(deployTruthBoxFixture);
      // First get deadline
      await time.increase(380*24*60*60);
      // Minter extends deadline
      await expect(truthBox_minter.extendDeadline(2, 10000))
        .to.be.revertedWithCustomError(truthBox, "DeadlineNotIn30days");
    });

    it("non-existent token-cannot extend deadline", async function () {
      const { 
        truthBox, fundManager, exchange,truthBox_DAO,truthBox_minter,MONTH
      } = await loadFixture(deployTruthBoxFixture);
  
      await expect(truthBox_DAO.extendDeadline(100, MONTH)).to.be.revertedWithCustomError(truthBox,"InvalidBoxId");
      await expect(truthBox_DAO.extendDeadline(100, MONTH)).to.revertedWithCustomError(truthBox,"InvalidBoxId");
  
      await expect(truthBox_minter.payConfiFee(0)).to.revertedWithCustomError(truthBox,"InvalidStatus");
      await expect(truthBox_minter.payConfiFee(1)).to.revertedWithCustomError(truthBox,"InvalidStatus");
  
    });
  });

  // Public operation tests
  describe("Public Operation Functionality", function() {
    it("minter should be able to publish token content at any time", async function () {
      const { truthBox_minter, truthBox ,minter} = await loadFixture(deployTruthBoxFixture);
      
      // Minter publishes token - only test function call, do not verify status
      await truthBox_minter.publishByMinter(2);
      expect(await truthBox.getStatus(2)).to.equal(Status.Published);
    });
    
    // Due to current contract implementation issues, skip these tests for now
    it("non-minter should not be able to publish token content", async function () {
      const { truthBox } = await loadFixture(deployTruthBoxFixture);
      
      // Non-minter attempts to publish
      await expect(truthBox.publishByMinter(2))
        .to.be.revertedWithCustomError(truthBox, "InvalidCaller");
    });
    
    it("sell/auction-if no one buys should directly become published status", async function () {
      const { 
        truthBox_minter, exchange_minter, truthBox_DAO, address_zero,
        truthBox_other, truthBox, testToken
      } = await loadFixture(deployTruthBoxFixture);
      
      // Set to selling and auctioning status
      await exchange_minter.sell(1, address_zero, 2000);
      await exchange_minter.auction(3, address_zero, 3000);
      
      // Advance time to simulate exceeding auction/sell period
      await time.increase(380 * 24 * 60 * 60);
      
      // Verify published status
      expect(await truthBox.getStatus(1)).to.equal(Status.Published);
      expect(await truthBox.getStatus(3)).to.equal(Status.Published);
    });
    
    it("if not sold/auctioned, non-minter cannot publish", async function () {
      const { truthBox, truthBox_minter } = await loadFixture(deployTruthBoxFixture);
      
      // Non-minter still cannot publish
      await expect(truthBox.publishByMinter(2))
        .to.be.revertedWithCustomError(truthBox, "InvalidCaller");
    });

    // Directly call PublicByBuyer  --- failed
    it("directly call publicByBuyer --- failed", async function () {
      const {truthBox, truthBox_buyer} = await loadFixture(deployTruthBoxFixture);
      await expect(truthBox_buyer.publishByBuyer(3)).to.be.revertedWithCustomError(truthBox,"NotBuyer");
      await expect(truthBox.publishByBuyer(1)).to.be.revertedWithCustomError(truthBox,"NotBuyer");
    });
  });
});

