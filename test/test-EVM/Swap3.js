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

describe("Trading Test - Refund Related Tests", function () {

  it("12-Sell-request refund-within period-expired", async function () {
    const { 
      exchange_minter,exchange_buyer, address_zero,
      officialToken,truthBox, 
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.sell(2, address_zero, 2000);
    // ========================== Buy 1 ==========================
    await exchange_buyer.buy(1);
    await exchange_buyer.buy(2);
    // ========================== Request refund ==========================
    // Within refund period,
    await exchange_buyer.requestRefund(1);
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Refunding);
    expect(await exchange.refundPermit(1)).to.equal(false); 

    // Exceeded refund period -- status directly completed
    await time.increase(20 * 24 * 60 * 60);
    await exchange_buyer.requestRefund(2);
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.InSecrecy);
    
    // ========================== Try to request refund again ==========================
    // Already requested refund, cannot request again
    await expect(exchange_buyer.requestRefund(1)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(2)).to.be.reverted;

  });

  it("12-Sell-review refund-within period-expired", async function () {
    const { 
      exchange_minter,exchange_buyer, exchange_DAO,
      officialToken,truthBox, address_zero,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.sell(2, address_zero, 2000);
    await exchange_minter.sell(3, address_zero, 2000);
    await exchange_minter.sell(4, address_zero, 2000);
    // ========================== Buy 1 ==========================
    await exchange_buyer.buy(1);
    await exchange_buyer.buy(2);
    await exchange_buyer.buy(3);
    await exchange_buyer.buy(4);
    // ========================== Request refund ==========================
    // Within refund period,
    await exchange_buyer.requestRefund(1);
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Refunding);
    expect(await exchange.refundPermit(1)).to.equal(false); 

    await exchange_buyer.requestRefund(2);
    await exchange_buyer.requestRefund(3);
    await exchange_buyer.requestRefund(4);
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Refunding);
    expect(await exchange.refundPermit(2)).to.equal(false); 

    // ========================== Review refund ==========================
    // Not expired
    await exchange_DAO.agreeRefund(1);
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Published);
    expect(await exchange.refundPermit(1)).to.equal(true); 

    await exchange_DAO.refuseRefund(2);
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.InSecrecy);
    expect(await exchange.refundPermit(2)).to.equal(false); 

    // Exceeded refund period -- status directly completed
    await time.increase(30 * 24 * 60 * 60);
    await exchange_DAO.agreeRefund(3);
    await exchange_buyer.refuseRefund(4); // Timeout does not need to check DAO
    expect(await truthBox.getStatus(3)).to.equal(TimeHelpers.Status.Published);
    expect(await truthBox.getStatus(4)).to.equal(TimeHelpers.Status.Published);
    
    // ========================== Try to execute again, revert ==========================
    // Already requested refund, cannot request again
    await expect(exchange_buyer.requestRefund(1)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(2)).to.be.reverted;

    await expect(exchange_DAO.agreeRefund(1)).to.be.reverted;
    await expect(exchange_DAO.agreeRefund(2)).to.be.reverted;


  });

  it("12-auction-request refund-within period-expired", async function () {
    const { 
      exchange_minter,exchange_buyer, address_zero,
      officialToken,truthBox, 
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.auction(3, address_zero, 2000);
    await exchange_minter.auction(4, address_zero, 2000);
    // ========================== Buy 1 ==========================
    await exchange_buyer.bid(3);
    await exchange_buyer.bid(4);

    await time.increase(40 * 24 * 60 * 60); 

    // ========================== Request refund ==========================
    // Within refund period,
    await exchange_buyer.requestRefund(3);
    expect(await truthBox.getStatus(3)).to.equal(TimeHelpers.Status.Refunding);
    expect(await exchange.refundPermit(3)).to.equal(false); 
    // Exceeded refund deadline
    await time.increase(40 * 24 * 60 * 60);
    await exchange_buyer.requestRefund(4);
    expect(await truthBox.getStatus(4)).to.equal(TimeHelpers.Status.InSecrecy); // Completed status
    expect(await exchange.refundPermit(4)).to.equal(false); 

    // ========================== Try to request refund again ==========================
    // Already requested refund, cannot request again
    await expect(exchange_buyer.requestRefund(3)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(4)).to.be.reverted;
  });

  it("12-auction-review refund-within period-expired", async function () {
    const { 
      exchange_minter,exchange_buyer, exchange_DAO,
      officialToken,truthBox, address_zero,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.auction(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 2000);
    await exchange_minter.auction(3, address_zero, 2000);
    await exchange_minter.auction(4, address_zero, 2000);
    // ========================== Buy 1 ==========================
    await exchange_buyer.bid(1);
    await exchange_buyer.bid(2);
    await exchange_buyer.bid(3);
    await exchange_buyer.bid(4);

    await time.increase(40 * 24 * 60 * 60); 

    // ========================== Request refund ==========================
    // Within refund period,
    await exchange_buyer.requestRefund(1);
    await exchange_buyer.requestRefund(2);
    await exchange_buyer.requestRefund(3);
    await exchange_buyer.requestRefund(4);
    expect(await truthBox.getStatus(3)).to.equal(TimeHelpers.Status.Refunding);
    expect(await exchange.refundPermit(3)).to.equal(false); 

    // ========================== Review refund ==========================
    await exchange_DAO.agreeRefund(1);
    await exchange_DAO.refuseRefund(2);
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Published);
    expect(await exchange.refundPermit(1)).to.equal(true); 
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.InSecrecy);
    expect(await exchange.refundPermit(2)).to.equal(false); 

    // Exceeded refund deadline
    await time.increase(40 * 24 * 60 * 60);
    await exchange_DAO.agreeRefund(3);
    await exchange_buyer.agreeRefund(4); // Exceeded deadline will not check DAO
    
    expect(await truthBox.getStatus(3)).to.equal(TimeHelpers.Status.Published); // Completed status
    expect(await truthBox.getStatus(4)).to.equal(TimeHelpers.Status.Published); // Completed status
    expect(await exchange.refundPermit(4)).to.equal(true); 

    // ========================== Try to request refund again ==========================
    // Already requested refund, cannot request again
    await expect(exchange_buyer.requestRefund(3)).to.be.reverted;
    await expect(exchange_buyer.requestRefund(4)).to.be.reverted;
  });

  it("14-buy-cancel refund-blacklist", async function () {
    const { 
      truthBox_minter, truthBox_other, exchange_minter,exchange_buyer,bytes32_buyer,
      officialToken, address_zero, bytes32_zero,
      truthBox, truthBox_DAO,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.sell(2, address_zero, 2000);
    // ========================== Buy 1 ==========================
    await exchange_buyer.buy(1);
    await exchange_buyer.buy(2);

    // ========================== Request refund ==========================
    await exchange_buyer.requestRefund(1);
    await exchange_buyer.requestRefund(2);
    // ========================== Cancel refund ==========================
    await exchange_buyer.cancelRefund(1);
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.InSecrecy);
    // Blacklisted --- 
    await truthBox_DAO.addBoxToBlacklist(2);
    await expect(exchange_buyer.cancelRefund(2)).to.be.reverted;
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Blacklisted); // Refunding
    expect(await exchange.refundPermit(2)).to.equal(true);

    // ========================== Try to cancel refund again !!!Error!!!==========================
    // Already requested refund, cannot request again
    await expect(exchange_buyer.cancelRefund(1)).to.be.reverted;
    await expect(exchange_buyer.cancelRefund(2)).to.be.reverted;

  });

  it("14-auction-agree refund-blacklist", async function () {
    const { 
      truthBox_minter, truthBox_other, exchange_minter,exchange_buyer,bytes32_buyer,
      officialToken, address_zero, exchange_DAO,
      truthBox, truthBox_DAO,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.auction(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 2000);
    // ========================== Buy 1 ==========================
    await exchange_buyer.bid(1);
    await exchange_buyer.bid(2);
    // ========================== Confirm 1 ==========================
    await time.increase(35 * 24 * 60 * 60);

    // ========================== Request refund ==========================
    await exchange_buyer.requestRefund(1);
    await exchange_buyer.requestRefund(2);
    // Add 2 and 4 to blacklist
    // ========================== Cancel refund ==========================
    await exchange_DAO.agreeRefund(1);
    // Due to timeout delivery, refund is generated
    expect(await exchange.refundPermit(1)).to.equal(true);
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Published);
    // Blacklisted --- 
    await truthBox_DAO.addBoxToBlacklist(2);
    await expect(exchange_buyer.agreeRefund(2)).to.be.reverted;
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Blacklisted); // Refunding
    expect(await exchange.refundPermit(2)).to.equal(true);

    // ========================== Try to cancel refund again !!!Error!!!==========================
    // Already requested refund, cannot request again
    await expect(exchange_buyer.cancelRefund(1)).to.be.reverted;
    await expect(exchange_buyer.cancelRefund(2)).to.be.reverted;

  });

});

