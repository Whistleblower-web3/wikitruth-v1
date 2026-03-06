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

describe("Swap4 test --- blacklist related tests", function () {

  it("13-sell/auction - add blacklist - request refund failed", async function () {
    const { 
      exchange_minter,exchange_buyer,bytes32_buyer,
      settlementToken, truthBox, truthBox_DAO, address_zero,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    // add 0 to blacklist, cannot sell and auction
    await truthBox_DAO.addToBlacklist(0);
    await expect(exchange_minter.sell(0, address_zero, 2000)).to.be.reverted;
    await expect(exchange_minter.auction(0, address_zero, 2000)).to.be.reverted;

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 2000);
    await exchange_buyer.buy(1);
    await exchange_buyer.bid(2);

    // ========================== deliver 1 ==========================
    // add 2 to blacklist
    await truthBox_DAO.addToBlacklist(1);
    await truthBox_DAO.addToBlacklist(2);
    // ========================== request refund ==========================

    // blacklist --- directly get refund
    await expect(exchange_buyer.requestRefund(1)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(2)).to.be.reverted;
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Blacklisted); // blacklist --- status unchanged
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Blacklisted); // blacklist --- status unchanged
    expect(await exchange.refundPermit(1)).to.equal(true); // blacklist --- directly get refund
    expect(await exchange.refundPermit(2)).to.equal(true); // blacklist --- directly get refund
    // ========================== try to request refund again ==========================
    // already requested refund, cannot request again
    await expect(exchange_buyer.requestRefund(1)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(2)).to.be.reverted;

  });

  it("13-sell/auction - request refund - add blacklist - subsequent operations failed", async function () {
    const { 
      exchange_minter,exchange_buyer,bytes32_buyer, exchange_DAO,
      settlementToken, truthBox, truthBox_DAO, address_zero,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.sell(2, address_zero, 2000);
    await exchange_minter.auction(3, address_zero, 2000);
    await exchange_minter.auction(4, address_zero, 2000);

    await exchange_buyer.buy(1);
    await exchange_buyer.buy(2);
    await exchange_buyer.bid(3);
    await exchange_buyer.bid(4);

    await time.increase(10 * 24 * 60 * 60); 
    await exchange_buyer.requestRefund(1);
    await exchange_buyer.requestRefund(2);
    // add 1 and 2 to blacklist
    await truthBox_DAO.addToBlacklist(1);
    await truthBox_DAO.addToBlacklist(2);

    await expect(exchange_DAO.agreeRefund(1)).to.be.reverted;
    await expect(exchange_DAO.agreeRefund(2)).to.be.reverted;

    // NOTE auction related
    await time.increase(30 * 24 * 60 * 60); 
    await exchange_buyer.requestRefund(3);
    await exchange_buyer.requestRefund(4);
    // add 3 and 4 to blacklist
    await truthBox_DAO.addToBlacklist(3);
    await truthBox_DAO.addToBlacklist(4);

    await expect(exchange_DAO.agreeRefund(3)).to.be.reverted;
    await expect(exchange_DAO.agreeRefund(4)).to.be.reverted;

    // ========================== check refund ==========================
    // blacklist --- directly get refund
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Blacklisted);
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Blacklisted);
    expect(await truthBox.getStatus(3)).to.equal(TimeHelpers.Status.Blacklisted);
    expect(await exchange.refundPermit(3)).to.equal(true); 
    expect(await truthBox.getStatus(4)).to.equal(TimeHelpers.Status.Blacklisted); // blacklist ---- status unchanged
    expect(await exchange.refundPermit(4)).to.equal(true); // blacklist --- directly get refund

    // ========================== try to request refund again ==========================
    // already requested refund, cannot request again
    await expect(exchange_buyer.requestRefund(1)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(2)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(3)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(4)).to.be.reverted;

  });


  it("14-after completion - add blacklist - subsequent operations failed", async function () {
    const { 
      truthBox_minter, truthBox_other, exchange_minter,exchange_buyer,truthBox_buyer,
      settlementToken, address_zero, bytes32_zero,
      truthBox, truthBox_DAO,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 2000);

    await exchange_buyer.buy(1);
    await exchange_buyer.bid(2);

    await time.increase(35*24*60*60)
    await exchange_buyer.completeOrder(1);
    await exchange_buyer.completeOrder(2);
    // add 1 and 2 to blacklist
    await truthBox_DAO.addToBlacklist(1);
    await truthBox_DAO.addToBlacklist(2);
    // ========================== check ==========================
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Blacklisted);
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Blacklisted); 

    // ========================== try to cancel refund again ===========================
    // already requested refund, cannot request again
    await expect(truthBox_buyer.delay(1)).to.be.reverted;
    await expect(truthBox_buyer.delay(2)).to.be.reverted;

    await expect(truthBox_buyer.publishByBuyer(1)).to.be.reverted;
    await expect(truthBox_buyer.publishByBuyer(2)).to.be.reverted;

  });

  it("14-sell/auction - add blacklist - cannot buy - withdraw failed", async function () {
    const { 
      truthBox_minter, truthBox_other, exchange_minter,exchange_buyer,fundManager_buyer,
      settlementToken, address_zero, bytes32_zero,
      truthBox, truthBox_DAO,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 2000);

    await truthBox_DAO.addToBlacklist(1);
    await truthBox_DAO.addToBlacklist(2);

    // ========================== buy failed ==========================
    await expect(exchange_buyer.buy(1)).to.be.reverted;
    await expect(exchange_buyer.bid(2)).to.be.reverted;

    // add 2 and 4 to blacklist
    // ========================== check ==========================
    // due to no buyer, so no refund permit
    expect(await exchange.refundPermit(1)).to.equal(false);
    expect(await exchange.refundPermit(2)).to.equal(false);
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Blacklisted);
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Blacklisted);

    // ========================== try to withdraw failed ===========================
    // already requested refund, cannot request again
    await expect(fundManager_buyer.withdrawOrderAmounts(settlementToken.target, [1,2])).to.be.reverted;
    await expect(fundManager_buyer.withdrawRefundAmounts(settlementToken.target, [1,2])).to.be.reverted;

  });

});

