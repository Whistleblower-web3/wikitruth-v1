const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { deployTruthBoxFixture } = require("./Fixture.js");
const crypto = require('crypto'); // Import crypto library, Node.js built-in encryption library
const exp = require("constants");
const { timestampToDate, secondsToDhms } = require('../utils/timeToDate.js');
const TimeHelpers = require("./helpers");

describe("Trading Test - Blacklist Related Tests", function () {

  it("13-sell/auction-add to blacklist-request refund failed", async function () {
    const { 
      exchange_minter,exchange_buyer,bytes32_buyer,
      officialToken, truthBox, truthBox_DAO, address_zero,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    // Add 0 to blacklist, cannot sell and auction
    await truthBox_DAO.addBoxToBlacklist(0);
    await expect(exchange_minter.sell(0, address_zero, 2000)).to.be.reverted;
    await expect(exchange_minter.auction(0, address_zero, 2000)).to.be.reverted;

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 2000);
    // ========================== Buy 1 ==========================
    await exchange_buyer.buy(1);
    await exchange_buyer.bid(2);

    // Add 2 to blacklist
    await truthBox_DAO.addBoxToBlacklist(1);
    await truthBox_DAO.addBoxToBlacklist(2);
    // ========================== Request refund ==========================

    // Blacklisted --- directly get refund
    await expect(exchange_buyer.requestRefund(1)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(2)).to.be.reverted;
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Blacklisted); // Blacklisted --- status unchanged
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Blacklisted); // Blacklisted --- status unchanged
    expect(await exchange.refundPermit(1)).to.equal(true); // Blacklisted --- directly get refund
    expect(await exchange.refundPermit(2)).to.equal(true); // Blacklisted --- directly get refund
    // ========================== Try to request refund again ==========================
    // Already requested refund, cannot request again
    await expect(exchange_buyer.requestRefund(1)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(2)).to.be.reverted;

  });

  it("13-sell/auction--request refund--add to blacklist--subsequent operations fail", async function () {
    const { 
      exchange_minter,exchange_buyer,bytes32_buyer, exchange_DAO,
      officialToken, truthBox, truthBox_DAO, address_zero,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.sell(2, address_zero, 2000);
    await exchange_minter.auction(3, address_zero, 2000);
    await exchange_minter.auction(4, address_zero, 2000);

    // ========================== Buy 1 ==========================
    await exchange_buyer.buy(1);
    await exchange_buyer.buy(2);
    await exchange_buyer.bid(3);
    await exchange_buyer.bid(4);

        // ========================== Request refund ==========================
    await time.increase(10 * 24 * 60 * 60); 
    await exchange_buyer.requestRefund(1);
    await exchange_buyer.requestRefund(2);
    // Add to blacklist
    await truthBox_DAO.addBoxToBlacklist(1);
    await truthBox_DAO.addBoxToBlacklist(2);

    await expect(exchange_DAO.agreeRefund(1)).to.be.reverted;
    await expect(exchange_DAO.agreeRefund(2)).to.be.reverted;

    // NOTE Auction related
    await time.increase(30 * 24 * 60 * 60); 
    await exchange_buyer.requestRefund(3);
    await exchange_buyer.requestRefund(4);
    // Add to blacklist
    await truthBox_DAO.addBoxToBlacklist(3);
    await truthBox_DAO.addBoxToBlacklist(4);

    await expect(exchange_DAO.agreeRefund(3)).to.be.reverted;
    await expect(exchange_DAO.agreeRefund(4)).to.be.reverted;

    // ========================== Verify refund ==========================
        // Blacklisted --- directly get refund
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Blacklisted);
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Blacklisted);
    expect(await truthBox.getStatus(3)).to.equal(TimeHelpers.Status.Blacklisted);
    expect(await exchange.refundPermit(3)).to.equal(true); 
    expect(await truthBox.getStatus(4)).to.equal(TimeHelpers.Status.Blacklisted); // Blacklisted ---- status unchanged
    expect(await exchange.refundPermit(4)).to.equal(true); // Blacklisted

    // ========================== Try to request refund again ==========================
    // Already requested refund, cannot request again
    await expect(exchange_buyer.requestRefund(1)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(2)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(3)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(4)).to.be.reverted;

  });


  it("14-after transaction completion-add to blacklist-subsequent operations fail", async function () {
    const { 
      truthBox_minter, truthBox_other, exchange_minter,exchange_buyer,truthBox_buyer,
      officialToken, address_zero, bytes32_zero,
      truthBox, truthBox_DAO,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 2000);
    // ========================== Buy 1 ==========================

    await exchange_buyer.buy(1);
    await exchange_buyer.bid(2);
    // ========================== Request refund ==========================

    await time.increase(35*24*60*60)
    await exchange_buyer.completeOrder(1);
    await exchange_buyer.completeOrder(2);
    // Add 2 and 4 to blacklist
    await truthBox_DAO.addBoxToBlacklist(1);
    await truthBox_DAO.addBoxToBlacklist(2);
    // ========================== Verify ==========================
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Blacklisted);
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Blacklisted); 

    // ========================== Try to cancel refund again !!!Error!!!==========================
    // Already requested refund, cannot request again
    await expect(truthBox_buyer.payConfiFee(1)).to.be.reverted;
    await expect(truthBox_buyer.payConfiFee(2)).to.be.reverted;

    await expect(truthBox_buyer.publishByBuyer(1)).to.be.reverted;
    await expect(truthBox_buyer.publishByBuyer(2)).to.be.reverted;

  });

  it("14-sell/auction-add to blacklist-cannot buy-withdrawal fails", async function () {
    const { 
      truthBox_minter, truthBox_other, exchange_minter,exchange_buyer,fundManager_buyer,
      officialToken, address_zero, bytes32_zero,
      truthBox, truthBox_DAO,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 2000);

    await truthBox_DAO.addBoxToBlacklist(1);
    await truthBox_DAO.addBoxToBlacklist(2);

    // ========================== Buy failed ==========================
    await expect(exchange_buyer.buy(1)).to.be.reverted;
    await expect(exchange_buyer.bid(2)).to.be.reverted;

    // Add 2 and 4 to blacklist
    // ========================== Verify ==========================
    // Since there is no buyer, there is no refund permit
    expect(await exchange.refundPermit(1)).to.equal(false);
    expect(await exchange.refundPermit(2)).to.equal(false);
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Blacklisted);
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Blacklisted);

    // ========================== Try withdrawal failed==========================
    // Already requested refund, cannot request again
    await expect(fundManager_buyer.withdrawOrderAmounts(officialToken.target, [1,2])).to.be.reverted;
    await expect(fundManager_buyer.withdrawRefundAmounts(officialToken.target, [1,2])).to.be.reverted;

  });

});

