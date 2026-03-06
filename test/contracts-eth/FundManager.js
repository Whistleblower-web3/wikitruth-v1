const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { deployTruthBoxFixture} = require("./Fixture.js");
const {timestampToDate,secondsToDhms} = require('../utils/timeToDate.js');

describe("FundManager", function () {

  it("Pause withdraw---only admin can switch", async function () {
    const { 
      admin, fundManager_DAO, dao, minter, fundManager_minter,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    // Switch to true
    await fundManager.pause();
    expect(await fundManager.paused()).to.equal(true);
    // Switch to false
    await fundManager.unpause();
    expect(await fundManager.paused()).to.equal(false);

    // ==============================Others call fail===============================
    await expect(fundManager_minter.pause()).to.be.reverted;
    await expect(fundManager_DAO.unpause()).to.be.reverted;

  });

  it("Withdraw---only admin can switch", async function () {
    const { 

      truthBox_minter, truthBox_buyer, exchange_minter,exchange_buyer,
      bytes32_1, bytes32_2, fundManager_minter, wBTC, settlementToken, address_zero,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    // ===========================mint =========================
    await exchange_minter.sell(0, address_zero, 2000);
    await exchange_buyer.buy(0);
    await exchange_buyer.completeOrder(0);

    // Switch to true
    await fundManager.pause();
    expect(await fundManager.paused()).to.equal(true);
    // ===========================Withdraw fail =========================
    await expect(fundManager_minter.withdrawMinterRewards(settlementToken.target)).to.reverted;

    // Switch to false
    await fundManager.unpause();
    expect(await fundManager.paused()).to.equal(false);

    // ===========================Withdraw success =========================
    await fundManager_minter.withdrawMinterRewards(settlementToken.target);

  });

  it("Direct receive orderAmount-should fail", async function () {
    const {admin, minter, fundManager,wBTC} = await loadFixture(deployTruthBoxFixture);

    const fundMinter = await fundManager.connect(minter);
    // Call receiveOrderAmount function, should throw exception
    await expect(fundMinter.payOrderAmount(1, minter.address,1000)).to.be.reverted;
    
  });

  it("Direct receive delay fee-should fail", async function () {
    const {admin, minter, seller, buyer, fundManager,wBTC} = await loadFixture(deployTruthBoxFixture);
    // Call receiveDelayFee function, should throw exception
    await expect(fundManager.payDelayFee(1, buyer.address, 1000)).to.be.reverted;
    // Check
    // expect(await fundManager.totalRewardAmounts(wBTC.target)).to.equal(1000);
    // expect(await fundManager.availableServiceFees()).to.equal(50);
    // const minterRewardAmounts = await fundManager.minterRewardAmounts(wBTC.target,1);
    // console.log("FundManager--minterRewardAmounts:", minterRewardAmounts.toString());

  });

  it("Direct allocationRewards-should fail", async function () {
    const {fundManager} = await loadFixture(deployTruthBoxFixture);
    // Call allocationRewards function, should throw exception
    await expect(fundManager.allocationRewards(1)).to.be.reverted;
    
  });


  it("Query-should be empty", async function () {
    const {minter, fundManager, seller, wBTC} = await loadFixture(deployTruthBoxFixture);
    // const orderAmount = await fundManager.orderAmount(1, minter.address);
    // Check orderMoney is empty
    expect(await fundManager.orderAmounts(1, minter.address)).to.equal(0);
    expect(await fundManager.helperRewardAmounts(wBTC.target,seller.address)).to.equal(0);

  });

  it("Non buyer withdraw refund amounts-should fail", async function () {
    const { 
      truthBox_minter, exchange_minter, exchange_buyer, fundManager_buyer,fundManager_completer,
      bytes32_buyer, bytes_deliver, fundManager, exchange,fundManager_minter,wBTC, 
      settlementToken,
      address_zero,
    } = await loadFixture(deployTruthBoxFixture);

    // Prepare test environment: sell, buy, deliver, request refund
    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_buyer.buy(1);
    await exchange_buyer.requestRefund(1);
    await exchange_minter.agreeRefund(1);
    
    // Verify buyer has refund permit
    expect(await exchange.refundPermit(1)).to.equal(true);
    
    // Non buyer (here use seller and other accounts) try to withdraw refund, should fail
    await expect(fundManager_minter.withdrawOrderAmounts(settlementToken.target, [1]))
      .to.be.reverted;
      
    await expect(fundManager_completer.withdrawOrderAmounts(settlementToken.target, [1]))
      .to.be.reverted;
      
    // The buyer should be able to successfully withdraw the refund
    await fundManager_buyer.withdrawRefundAmounts(settlementToken.target, [1]);
    
    // Try to withdraw again should fail, because the amount has been withdrawn
    await expect(fundManager_buyer.withdrawOrderAmounts(settlementToken.target, [1]))
      .to.be.reverted;
  });

  it("Non minter withdraw minter rewards-should fail", async function () {
    const { 
      truthBox_minter, exchange_minter, exchange_buyer, exchange_other,
      bytes32_buyer, bytes_deliver, fundManager, fundManager_buyer,
      wBTC, address_zero, settlementToken,
      truthBox,minter,fundManager_completer,fundManager_minter,
    } = await loadFixture(deployTruthBoxFixture);

    // Prepare test environment: sell, buy, complete order
    await exchange_minter.sell(2, address_zero, 2000);
    await exchange_buyer.buy(2);
    await exchange_buyer.completeOrder(2);
    
    // Non minter (here use buyer and other accounts) try to withdraw minter rewards, should fail
    await expect(fundManager_buyer.withdrawMinterRewards(settlementToken.target))
      .to.be.revertedWithCustomError(fundManager, "AmountIsZero");
      
    await expect(fundManager_completer.withdrawMinterRewards(settlementToken.target))
      .to.be.revertedWithCustomError(fundManager, "AmountIsZero");
      
    // The minter should be able to successfully withdraw the rewards
    await fundManager_minter.withdrawMinterRewards(settlementToken.target);
    
    // Try to withdraw again should fail, because the amount has been withdrawn
    await expect(fundManager_minter.withdrawMinterRewards(settlementToken.target))
      .to.be.revertedWithCustomError(fundManager, "AmountIsZero");
  });

  it("Buyer withdraw order amounts-should fail", async function () {
    const { 
      truthBox_minter, exchange_minter, exchange_buyer, exchange_buyer2, exchange_other,
      wBTC, address_zero, settlementToken,
      bytes32_buyer, fundManager, exchange,buyer2,fundManager_buyer2,fundManager_buyer
    } = await loadFixture(deployTruthBoxFixture);

    // Prepare test environment: sell and bid, but not final purchase
    await exchange_minter.auction(3, address_zero, 2000);
    
    // Multiple accounts bid
    await exchange_buyer.bid(3);
    await exchange_buyer2.bid(3);
    
    // Verify current buyer is other account (last bidder)
    expect(await exchange.buyerOf(3)).to.equal(buyer2.address);
    
    // Current buyer tries to withdraw order amount, should fail
    await expect(fundManager_buyer2.withdrawOrderAmounts(settlementToken.target, [3]))
      .to.be.revertedWithCustomError(fundManager, "InvalidCaller");
      
    // Already replaced previous bidder can withdraw their order amount
    await fundManager_buyer.withdrawOrderAmounts(settlementToken.target, [3]);
    
    // Create a new auction
    await exchange_minter.auction(4, address_zero, 3000);
    
    // Buyer bids but has not been replaced
    await exchange_buyer.bid(4);
    
    // Buyer tries to withdraw their order amount, should fail
    await expect(fundManager_buyer.withdrawOrderAmounts(settlementToken.target, [4]))
      .to.be.revertedWithCustomError(fundManager, "InvalidCaller");
    
    // Not bidder account should also be unable to withdraw (amount is 0)
    await expect(fundManager_buyer2.withdrawOrderAmounts(settlementToken.target, [4]))
      .to.be.revertedWithCustomError(fundManager, "AmountIsZero");
  });

  it("Adjust fee rate-should fail", async function () { 
    const { 
      truthBox, exchange_minter, exchange_buyer, exchange_buyer2, exchange_other,
      settlementToken, exchange_DAO, truthBox_DAO, fundManager_DAO,buyer, truthBox_buyer,
      bytes32_buyer, fundManager, exchange,buyer2,fundManager_buyer2,fundManager_buyer,
      address_zero,
    } = await loadFixture(deployTruthBoxFixture);

    // Adjust fee rate
    await exchange_DAO.setBidIncrementRate(150);
    await truthBox_DAO.setIncrementRate(150);

    // Auction complete
    await exchange_minter.auction(1, address_zero, 2000);
    // await exchange_buyer2.bid(1);
    await exchange_buyer.bid(1);

    await time.increase(35*24*60*60);
    await exchange_buyer.completeOrder(1);

    // Verify price is 3000
    expect (await truthBox.getPrice(1)).to.equal(3000);
    
    // Pay delay fee
    await time.increase(340*24*60*60);
    const balance_buyer_1 = await settlementToken.balanceOf(buyer.address)
    await truthBox_buyer.delay(1);
    const balance_buyer_2 = await settlementToken.balanceOf(buyer.address)

    await time.increase(365*24*60*60);
    expect(balance_buyer_1-balance_buyer_2).to.equal(3000);
    await truthBox_buyer.delay(1);
    const balance_buyer_3 = await settlementToken.balanceOf(buyer.address)
    expect(balance_buyer_2-balance_buyer_3).to.equal(4500);

  });

});

