const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { deployTruthBoxFixture} = require("./Fixture.js");
const crypto = require('crypto'); // Import crypto library, Node.js built-in encryption library
const { Status } = require("./helpers.js");

describe("TruthBox_Public Tests", function () {

  // Only test blacklist functionality, skip other tests for now
  it("sell/auction---buyer purchases---active publish---expired publish", async function () {
    const { 
      admin, minter, dao, truthBox, truthNFT, testToken,
      truthBox_minter, truthBox_buyer, exchange_minter,
      exchange_buyer, exchange_DAO, fundManager, address_zero,
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 2000);

    await exchange_minter.sell(3, address_zero, 2000);
    await exchange_minter.auction(4, address_zero, 2000);

    // ========================== Purchase ==========================
    await exchange_buyer.buy(1)
    await exchange_buyer.bid(2)
    await exchange_buyer.buy(3)
    await exchange_buyer.bid(4)
    await time.increase(80*24*60*60);

    await exchange_buyer.completeOrder(1)
    await exchange_buyer.completeOrder(2)
    await exchange_buyer.completeOrder(3)
    await exchange_buyer.completeOrder(4)

    expect(await truthBox.getStatus(1)).to.equal(Status.InSecrecy);
    expect(await truthBox.getStatus(2)).to.equal(Status.InSecrecy);

    // ========================== Publish ==========================
    // minter cannot perform publish operation
    await expect(truthBox_minter.publishByMinter(1)).to.be.reverted;

    await truthBox_buyer.publishByBuyer(1)
    await truthBox_buyer.publishByBuyer(2)
    // Call PublicNoBuyer function, pass in NFTBox #2
    expect(await truthBox.getStatus(1)).to.equal(Status.Published);
    expect(await truthBox.getStatus(2)).to.equal(Status.Published);

    await time.increase(380*24*60*60);

    expect(await truthBox.getStatus(3)).to.equal(Status.Published);
    expect(await truthBox.getStatus(4)).to.equal(Status.Published);
  });

  it("sell/auction-no buyer---expired directly becomes published status", async function () {
    const { 
      admin, minter, dao, truthBox, truthNFT, testToken,
      truthBox_minter, truthBox_DAO, exchange_minter, 
      exchange_buyer, exchange_DAO, fundManager, address_zero,
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 2000);

    // ========================== Publish other ==========================
    await time.increase(40*24*60*60);
    
    expect(await truthBox.getStatus(1)).to.equal(Status.Selling);
    expect(await truthBox.getStatus(2)).to.equal(Status.Published);
    // Calling again will error

    await time.increase(340*24*60*60);
    expect(await truthBox.getStatus(1)).to.equal(Status.Published);

  });

  it("sell/auction---minter cannot perform publish!", async function () {
    const { 
      admin, minter, dao, buyer, truthBox,testToken,
      truthBox_minter, truthBox_DAO, exchange_minter, address_zero,
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 2000);

    // Move forward 20 days
    await time.increase(20*24*60*60);
    expect(await truthBox.getStatus(2)).to.equal(Status.Auctioning);

    // ========================== Publish ==========================
    await expect(truthBox_minter.publishByMinter(2)).to.be.reverted;
    
    await time.increase(160*24*60*60);
    expect(await truthBox.getStatus(1)).to.equal(Status.Selling);
    await expect(truthBox_minter.publishByMinter(2)).to.be.reverted;

  });

});

