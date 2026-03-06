const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { deployTruthBoxFixture} = require("./Fixture.js");
const {timestampToDate,secondsToDhms} = require('../utils/timeToDate.js');
const { Status } = require("./helpers.js");

describe("TruthBox test --- basic functions", function () {
  // basic minting function test
  describe("Basic minting function", function() {
    it("should correctly mint TruthBox and get Box information", async function () {
      // test fixture initialization
      const { admin, minter, other, truthBox, bytes_mint, 
        truthBox_minter, truthBox_other, dao} = await loadFixture(deployTruthBoxFixture);
      
      // mint a new token
      await truthBox_minter.create("10_tokenURI", "10_infoURI", bytes_mint, 1000);
      
      // get and verify Box information  TODO: temporarily not needed this function
      // const boxInfo_0 = await truthBox.getBoxInfoCID(0);
      // expect(boxInfo_0).to.equal("00_infoURI");
      const [status_0, price_0, deadline_0, ] = await truthBox.getBasicData(0);
      expect(status_0).to.equal(Status.Storing);
    });
  });

  // 黑名单功能测试
  describe("Blacklist function", function() {
    it("add blacklist - get information failed", async function () {
      // test fixture initialization
      const { admin, minter, buyer, other, truthBox, bytes_mint, dao, truthBox_DAO,
        } = await loadFixture(deployTruthBoxFixture);
      
      // add to blacklist - use DAO account
      await truthBox_DAO.addToBlacklist(1);
      expect(await truthBox.isInBlacklist(1)).to.equal(true);
      
      
    });
    
  });

  it("10-blacklist token - buy/auction", async function () {
    const { minter, buyer, truthBox, exchange, fundManager, truthBox_DAO,
      wBTC, bytes32_1 , exchange_minter, exchange_buyer, address_zero,
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 1000);
    await truthBox_DAO.addToBlacklist(1);
    await truthBox_DAO.addToBlacklist(2);
    // ========================== buy 1 ==========================
    // should throw exception
    await expect(exchange_buyer.buy(1)).to.be.reverted;
    // 
    await expect(exchange_buyer.bid(2)).to.be.reverted;
  });

  describe("Deadline function", function() {
    it("not expired, minter can delay deadline", async function () {
      const { truthBox_minter, truthBox ,minter,exchange_minter,truthBox_buyer} = await loadFixture(deployTruthBoxFixture);
      const deadline = Number(await truthBox.getDeadline(2));
      // minter delay deadline
      await time.increase(340*24*60*60)
      await truthBox_minter.extendDeadline(2, 10000);
      const newDeadline = Number(await truthBox.getDeadline(2));
      // check if deadline is extended
      expect(newDeadline).to.equal(deadline + 10000);

      // non-minter cannot delay deadline
      await expect(truthBox_buyer.extendDeadline(2, 10000))
        .to.be.revertedWithCustomError(truthBox, "NotMinter");
    });

    it("expired, minter cannot delay deadline", async function () {
      const { truthBox_minter, truthBox ,minter,exchange_minter,exchange_buyer} = await loadFixture(deployTruthBoxFixture);
      await time.increase(380*24*60*60);
      await expect(truthBox_minter.extendDeadline(2, 10000))
        .to.be.revertedWithCustomError(truthBox, "NotInWindowPeriod");
    });

    it("non-existent token - cannot delay deadline", async function () {
      const { 
        truthBox, fundManager, exchange,truthBox_DAO,truthBox_minter,MONTH
      } = await loadFixture(deployTruthBoxFixture);
  
      await expect(truthBox_DAO.extendDeadline(100, MONTH)).to.be.revertedWithCustomError(truthBox,"NotMinter");
      await expect(truthBox_DAO.extendDeadline(100, MONTH)).to.be.revertedWithCustomError(truthBox,"NotMinter");
  
      await expect(truthBox_minter.delay(0)).to.revertedWithCustomError(truthBox,"InvalidStatus");
      await expect(truthBox_minter.delay(1)).to.revertedWithCustomError(truthBox,"InvalidStatus");
  
    });
  });

  describe("Publish function", function() {
    it("minter publish", async function () {
      const { truthBox_minter, truthBox ,minter} = await loadFixture(deployTruthBoxFixture);
      
      await truthBox_minter.publishByMinter(2);
      expect(await truthBox.getStatus(2)).to.equal(Status.Published);
    });
    
    it("non-minter cannot publish", async function () {
      const { truthBox } = await loadFixture(deployTruthBoxFixture);
      
      await expect(truthBox.publishByMinter(2))
        .to.be.revertedWithCustomError(truthBox, "NotMinter");
    });
    
      it("sell/auction - no buyer - automatic public - anyone can view secret data", async function () {
    const { 
      admin, minter, dao, truthBox, wBTC, bytes_mint,
      truthBox_minter, truthBox_DAO, exchange_minter, 
      exchange_buyer, exchange_DAO, fundManager, address_zero,
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 2000);

    // ========================== automatic public ==========================
    await time.increase(40*24*60*60);
    
    expect(await truthBox.getStatus(1)).to.equal(Status.Selling);
    expect(await truthBox.getStatus(2)).to.equal(Status.Published);
    expect(await truthBox.getSecretData(2)).to.equal(bytes_mint);

    await time.increase(340*24*60*60);
    expect(await truthBox.getStatus(1)).to.equal(Status.Published);
    expect(await truthBox.getSecretData(1)).to.equal(bytes_mint);

  });
    
    it("directly call publicByBuyer - failed", async function () {
      const {truthBox, truthBox_buyer} = await loadFixture(deployTruthBoxFixture);
      await expect(truthBox_buyer.publishByBuyer(3)).to.be.revertedWithCustomError(truthBox,"NotBuyer");
      await expect(truthBox.publishByBuyer(1)).to.be.revertedWithCustomError(truthBox,"NotBuyer");
    });

    it("sell/auction - minter cannot publish", async function () {
    const { 
      admin, minter, dao, buyer, truthBox,wBTC,
      truthBox_minter, truthBox_DAO, exchange_minter, address_zero,
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 2000);

    // move 20 days forward
    await time.increase(20*24*60*60);
    expect(await truthBox.getStatus(2)).to.equal(Status.Auctioning);

    // ========================== publish failed ==========================
    await expect(truthBox_minter.publishByMinter(2)).to.be.reverted;
    
    await time.increase(160*24*60*60);
    expect(await truthBox.getStatus(1)).to.equal(Status.Selling);
    await expect(truthBox_minter.publishByMinter(2)).to.be.reverted;

  });

  
  it("sell/auction - buyer buy - publish - automatic public", async function () {
    const { 
      admin, minter, dao, truthBox, wBTC,
      truthBox_minter, truthBox_buyer, exchange_minter,
      exchange_buyer, exchange_DAO, fundManager, address_zero,
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 2000);

    await exchange_minter.sell(3, address_zero, 2000);
    await exchange_minter.auction(4, address_zero, 2000);

    await exchange_buyer.buy(1)
    await exchange_buyer.bid(2)
    await exchange_buyer.buy(3)
    await exchange_buyer.bid(4)
    await time.increase(80*24*60*60);

    await exchange_buyer.completeOrder(1)
    await exchange_buyer.completeOrder(2)
    await exchange_buyer.completeOrder(3)
    await exchange_buyer.completeOrder(4)

    expect(await truthBox.getStatus(1)).to.equal(Status.Delaying);
    expect(await truthBox.getStatus(2)).to.equal(Status.Delaying);

    // ========================== publish ==========================
    // minter cannot publish
    await expect(truthBox_minter.publishByMinter(1)).to.be.reverted;

    await truthBox_buyer.publishByBuyer(1)
    await truthBox_buyer.publishByBuyer(2)
    // call PublicNoBuyer function, pass in Box 2
    expect(await truthBox.getStatus(1)).to.equal(Status.Published);
    expect(await truthBox.getStatus(2)).to.equal(Status.Published);

    // ========================== automatic public ==========================
    await time.increase(380*24*60*60);

    expect(await truthBox.getStatus(3)).to.equal(Status.Published);
    expect(await truthBox.getStatus(4)).to.equal(Status.Published);
  });
  });
});

