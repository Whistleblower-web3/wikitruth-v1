const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { deployTruthBoxFixture} = require("./Fixture.js");
const crypto = require('crypto'); 
const {timestampToDate,secondsToDhms} = require('../utils/timeToDate.js');

describe("Exchange", function () {

  it("query-Dao set period-success", async function () {
    const { 
      exchange_DAO,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);
    
    const refundReviewPeriod = secondsToDhms(Number(await exchange.refundReviewPeriod()));
    const refundRequestPeriod = secondsToDhms(Number(await exchange.refundRequestPeriod()));
    console.log("Exchange--30 days", refundReviewPeriod);
    console.log("Exchange--15 days", refundRequestPeriod);
    
    // Call setConfirmDeadline function, pass in 20 days
    await exchange_DAO.setRefundRequestPeriod(10*24*60*60);
    expect(await exchange.refundRequestPeriod()).to.equal(10*24*60*60);
    await exchange_DAO.setRefundReviewPeriod(30*24*60*60);
    expect(await exchange.refundReviewPeriod()).to.equal(30*24*60*60);

    // ===========================Dao set period=====================
    await exchange_DAO.setRefundRequestPeriod(15*24*60*60);
    expect(await exchange.refundRequestPeriod()).to.equal(15*24*60*60);
    await exchange_DAO.setRefundReviewPeriod(50*24*60*60);
    expect(await exchange.refundReviewPeriod()).to.equal(50*24*60*60);

  });

  it("set period-fail", async function () {
    const {exchange_DAO, exchange, exchange_minter} = await loadFixture(deployTruthBoxFixture);
    
    // ==========================period value is incorrect=========================
    await expect(exchange_DAO.setRefundRequestPeriod(3*24*60*60)).to.be.revertedWithCustomError(exchange,"InvalidPeriod");
    await expect(exchange_DAO.setRefundRequestPeriod(20*24*60*60)).to.be.revertedWithCustomError(exchange,"InvalidPeriod");
    await expect(exchange_DAO.setRefundReviewPeriod(10*24*60*60)).to.be.revertedWithCustomError(exchange,"InvalidPeriod");
    await expect(exchange_DAO.setRefundReviewPeriod(70*24*60*60)).to.be.revertedWithCustomError(exchange,"InvalidPeriod");
    
    // ==========================caller is incorrect=========================
    await expect(exchange_minter.setRefundRequestPeriod(15*24*60*60)).to.be.revertedWithCustomError(exchange_minter,"NotDAO");
    await expect(exchange_minter.setRefundReviewPeriod(50*24*60*60)).to.be.revertedWithCustomError(exchange_minter,"NotDAO");

  });

  // Directly set refund permit --- fail
  it("Directly set refund permit --- fail", async function () {
    const {exchange_minter, exchange} = await loadFixture(deployTruthBoxFixture);
    await expect(exchange.setRefundPermit(3, true)).to.be.revertedWithCustomError(exchange,"NotProjectCaller");
    await expect(exchange.setRefundPermit(1, true)).to.be.revertedWithCustomError(exchange,"NotProjectCaller");
    
  });


});

