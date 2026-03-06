const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { deployTruthBoxFixture } = require("./Fixture.js");
const exp = require("constants");
const { timestampToDate, secondsToDhms } = require('../utils/timeToDate.js');
const TimeHelpers = require("./helpers");

describe("Swap3 test --- refund related tests", function () {

  it("12-sell - request refund - in period - overdue", async function () {
    const { 
      exchange_minter,exchange_buyer, address_zero,
      settlementToken,truthBox, 
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.sell(2, address_zero, 2000);
    await exchange_buyer.buy(1);
    await exchange_buyer.buy(2);
    // ========================== request refund ==========================
    // in refund period
    await exchange_buyer.requestRefund(1);
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Refunding);
    expect(await exchange.refundPermit(1)).to.equal(false); 

    // overdue -- status directly completed
    await time.increase(20 * 24 * 60 * 60);
    await exchange_buyer.requestRefund(2);
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Delaying);
    
    // ========================== try to request refund again ==========================
    // already requested refund, cannot request again
    await expect(exchange_buyer.requestRefund(1)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(2)).to.be.reverted;

  });

  it("12-sell - review refund - in period - overdue", async function () {
    const { 
      exchange_minter,exchange_buyer, exchange_DAO,
      settlementToken,truthBox, address_zero,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.sell(2, address_zero, 2000);
    await exchange_minter.sell(3, address_zero, 2000);
    await exchange_minter.sell(4, address_zero, 2000);
    await exchange_buyer.buy(1);
    await exchange_buyer.buy(2);
    await exchange_buyer.buy(3);
    await exchange_buyer.buy(4);
    // ========================== request refund ==========================
    // in refund period
    await exchange_buyer.requestRefund(1);
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Refunding);
    expect(await exchange.refundPermit(1)).to.equal(false); 

    await exchange_buyer.requestRefund(2);
    await exchange_buyer.requestRefund(3);
    await exchange_buyer.requestRefund(4);
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Refunding);
    expect(await exchange.refundPermit(2)).to.equal(false); 

    // ========================== review refund ==========================
    // not overdue
    await exchange_DAO.agreeRefund(1);
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Published);
    expect(await exchange.refundPermit(1)).to.equal(true); 

    await exchange_DAO.refuseRefund(2);
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Delaying);
    expect(await exchange.refundPermit(2)).to.equal(false); 

    // overdue -- status directly completed
    await time.increase(30 * 24 * 60 * 60);
    await exchange_DAO.agreeRefund(3);
    await exchange_buyer.refuseRefund(4); // overdue does not need to check DAO
    expect(await truthBox.getStatus(3)).to.equal(TimeHelpers.Status.Published);
    expect(await truthBox.getStatus(4)).to.equal(TimeHelpers.Status.Published);
    
    // ========================== try to request refund again ==========================
    // already requested refund, cannot request again
    await expect(exchange_buyer.requestRefund(1)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(2)).to.be.reverted;

    await expect(exchange_DAO.agreeRefund(1)).to.be.reverted;
    await expect(exchange_DAO.agreeRefund(2)).to.be.reverted;


  });

  it("12-auction - request refund - in period - overdue", async function () {
    const { 
      exchange_minter,exchange_buyer, address_zero,
      settlementToken,truthBox, 
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.auction(3, address_zero, 2000);
    await exchange_minter.auction(4, address_zero, 2000);
    await exchange_buyer.bid(3);
    await exchange_buyer.bid(4);

    await time.increase(40 * 24 * 60 * 60); 

    // ========================== request refund ==========================
    // in refund period
    await exchange_buyer.requestRefund(3);
    expect(await truthBox.getStatus(3)).to.equal(TimeHelpers.Status.Refunding);
    expect(await exchange.refundPermit(3)).to.equal(false); 
    // overdue
    await time.increase(40 * 24 * 60 * 60);
    await exchange_buyer.requestRefund(4);
    expect(await truthBox.getStatus(4)).to.equal(TimeHelpers.Status.Delaying); 
    expect(await exchange.refundPermit(4)).to.equal(false); 

    // ========================== try to request refund again ==========================
    // already requested refund, cannot request again
    await expect(exchange_buyer.requestRefund(3)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(4)).to.be.reverted;
  });

  it("12-auction - review refund - in period - overdue", async function () {
    const { 
      exchange_minter,exchange_buyer, exchange_DAO,
      settlementToken,truthBox, address_zero,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.auction(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 2000);
    await exchange_minter.auction(3, address_zero, 2000);
    await exchange_minter.auction(4, address_zero, 2000);
    await exchange_buyer.bid(1);
    await exchange_buyer.bid(2);
    await exchange_buyer.bid(3);
    await exchange_buyer.bid(4);

    await time.increase(40 * 24 * 60 * 60); 

    // ========================== request refund ==========================
    // in refund period
    await exchange_buyer.requestRefund(1);
    await exchange_buyer.requestRefund(2);
    await exchange_buyer.requestRefund(3);
    await exchange_buyer.requestRefund(4);
    expect(await truthBox.getStatus(3)).to.equal(TimeHelpers.Status.Refunding);
    expect(await exchange.refundPermit(3)).to.equal(false); 

    // ========================== review refund ==========================
    await exchange_DAO.agreeRefund(1);
    await exchange_DAO.refuseRefund(2);
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Published);
    expect(await exchange.refundPermit(1)).to.equal(true); 
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Delaying);
    expect(await exchange.refundPermit(2)).to.equal(false); 

    // overdue
    await time.increase(40 * 24 * 60 * 60);
    await exchange_DAO.agreeRefund(3);
    await exchange_buyer.agreeRefund(4); // overdue does not need to check DAO
    
    expect(await truthBox.getStatus(3)).to.equal(TimeHelpers.Status.Published); 
    expect(await truthBox.getStatus(4)).to.equal(TimeHelpers.Status.Published); 
    expect(await exchange.refundPermit(4)).to.equal(true); 

    // ========================== try to request refund again ==========================
    // already requested refund, cannot request again
    await expect(exchange_buyer.requestRefund(3)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(4)).to.be.reverted;
  });

  it("14-cancel refund - blacklist", async function () {
    const { 
      truthBox_minter, truthBox_other, exchange_minter,exchange_buyer,bytes32_buyer,
      settlementToken, address_zero, bytes32_zero,
      truthBox, truthBox_DAO,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.sell(2, address_zero, 2000);
    await exchange_buyer.buy(1);
    await exchange_buyer.buy(2);

    // ========================== request refund ==========================
    await exchange_buyer.requestRefund(1);
    await exchange_buyer.requestRefund(2);
    // ========================== cancel refund ==========================
    await exchange_buyer.cancelRefund(1);
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Delaying);
    // blacklist --- 
    await truthBox_DAO.addToBlacklist(2);
    await expect(exchange_buyer.cancelRefund(2)).to.be.reverted;
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Blacklisted); // Refunding
    expect(await exchange.refundPermit(2)).to.equal(true);

    // ========================== try to cancel refund again ===========================
    // already requested refund, cannot request again
    await expect(exchange_buyer.cancelRefund(1)).to.be.reverted;
    await expect(exchange_buyer.cancelRefund(2)).to.be.reverted;

  });

  it("14-auction - agree refund - blacklist", async function () {
    const { 
      truthBox_minter, truthBox_other, exchange_minter,exchange_buyer,bytes32_buyer,
      settlementToken, address_zero, exchange_DAO,
      truthBox, truthBox_DAO,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.auction(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 2000);
    await exchange_buyer.bid(1);
    await exchange_buyer.bid(2);
    await time.increase(35 * 24 * 60 * 60);

    // ========================== request refund ==========================
    await exchange_buyer.requestRefund(1);
    await exchange_buyer.requestRefund(2);
    // add 2 and 4 to blacklist
    // ========================== cancel refund ==========================
    await exchange_DAO.agreeRefund(1);
    // due to overdue delivery, there is refund
    expect(await exchange.refundPermit(1)).to.equal(true);
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Published);
    // blacklist --- 
    await truthBox_DAO.addToBlacklist(2);
    await expect(exchange_buyer.agreeRefund(2)).to.be.reverted;
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Blacklisted); // Refunding
    expect(await exchange.refundPermit(2)).to.equal(true);

    // ========================== try to cancel refund again ===========================
    // already requested refund, cannot request again
    await expect(exchange_buyer.cancelRefund(1)).to.be.reverted;
    await expect(exchange_buyer.cancelRefund(2)).to.be.reverted;

  });

});

