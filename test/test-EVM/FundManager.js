const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { deployTruthBoxFixture} = require("./Fixture.js");
const {timestampToDate,secondsToDhms} = require('../utils/timeToDate.js');

describe("FundManager", function () {

  it("toggle withdrawal permission---only admin can toggle", async function () {
    const { 
      admin, fundManager_DAO, dao, minter, fundManager_minter,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    // Toggle to true
    await fundManager.togglePause();
    expect(await fundManager.paused()).to.equal(true);
    await fundManager.togglePause();
    expect(await fundManager.paused()).to.equal(false);

    // ==============================Others calling fails===============================
    // Call togglePauseWithdraw function, should throw exception
    await expect(fundManager_minter.togglePause()).to.be.reverted;
    // Call togglePauseWithdraw function, should throw exception
    await expect(fundManager_DAO.togglePause()).to.be.reverted;

  });

  it("toggle withdrawal permission---withdrawal", async function () {
    const { 

      truthBox_minter, truthBox_buyer, exchange_minter,exchange_buyer,
      bytes32_1, bytes32_2, fundManager_minter, testToken, officialToken, address_zero,
      fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    // ===========================mint =========================
    await exchange_minter.sell(0, address_zero, 2000);
    await exchange_buyer.buy(0);
    await exchange_buyer.completeOrder(0);

    // Toggle to true (i.e., paused)
    await fundManager.togglePause();
    expect(await fundManager.paused()).to.equal(true);
    // ===========================Withdrawal failed! =========================
    await expect(fundManager_minter.withdrawMinterRewards(officialToken.target)).to.reverted;

    // Toggle to false (i.e., resumed)
    await fundManager.togglePause();
    expect(await fundManager.paused()).to.equal(false);

    // ===========================Withdrawal successful! =========================
    await fundManager_minter.withdrawMinterRewards(officialToken.target);

  });

  // Set slippage-success
  // it("set slippage-success", async function () {
  //   const {admin, fundManager} = await loadFixture(deployTruthBoxFixture);
  //   await fundManager.setSlippageProtection(10);
  //   expect(await fundManager.slippageProtection()).to.equal(10);
  // });

  // Set slippage-failed
  // it("set slippage-failed", async function () {
  //   const {admin, fundManager} = await loadFixture(deployTruthBoxFixture);
  //   await expect(fundManager.setSlippageProtection(101)).to.be.reverted;
  //   await expect(fundManager.setSlippageProtection(0)).to.be.reverted;
  // });

  it("direct--receive orderAmount-failed", async function () {
    const {admin, minter, fundManager,testToken} = await loadFixture(deployTruthBoxFixture);

    const fundMinter = await fundManager.connect(minter);
    // Call receive service fee function, pass in 1000 tokens
    await expect(fundMinter.payOrderAmount(1, minter.address,1000)).to.be.reverted;
    
  });

  it("receive confidential fee-failed-cannot call directly", async function () {
    const {admin, minter, seller, buyer, fundManager,testToken} = await loadFixture(deployTruthBoxFixture);
    // Call receive service fee function, pass in 1000 tokens
    await expect(fundManager.payConfidentialityFee(1, buyer.address, 1000)).to.be.reverted;
    // Check
    // expect(await fundManager.totalRewardAmounts(testToken.target)).to.equal(1000);
    // expect(await fundManager.availableServiceFees()).to.equal(50);
    // const minterRewardAmounts = await fundManager.minterRewardAmounts(testToken.target,1);
    // console.log("FundManager--minterRewardAmounts:", minterRewardAmounts.toString());

  });

  it("direct--allocationRewards-failed", async function () {
    const {fundManager} = await loadFixture(deployTruthBoxFixture);
    // Call feeToken contract mint function, send 10000 tokens to minter address
    await expect(fundManager.allocationRewards(1)).to.be.reverted;
    
  });


  it("query-empty", async function () {
    const {minter, fundManager, seller, testToken} = await loadFixture(deployTruthBoxFixture);
    // const orderAmount = await fundManager.orderAmount(1, minter.address);
    // Check if orderMoney is empty
    expect(await fundManager.orderAmounts(1, minter.address)).to.equal(0);
    expect(await fundManager.helperRewardAmounts(testToken.target,seller.address)).to.equal(0);

  });

  // 1, Test if non-buyer can withdraw withdrawRefundAmounts

  it("non-buyer withdraw refund-failed", async function () {
    const { 
      truthBox_minter, exchange_minter, exchange_buyer, fundManager_buyer,fundManager_completer,
      bytes32_buyer, bytes_deliver, fundManager, exchange,fundManager_minter,testToken, 
      officialToken,
      address_zero,
    } = await loadFixture(deployTruthBoxFixture);

    // Prepare test environment: sell, buy, deliver, request refund
    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_buyer.buy(1);
    await exchange_buyer.requestRefund(1);
    await exchange_minter.agreeRefund(1);
    
    // Verify if buyer has refund permit
    expect(await exchange.refundPermit(1)).to.equal(true);
    
    // Non-buyers (here using seller and other accounts) attempt to withdraw refund, should fail
    await expect(fundManager_minter.withdrawOrderAmounts(officialToken.target, [1]))
      .to.be.reverted;
      
    await expect(fundManager_completer.withdrawOrderAmounts(officialToken.target, [1]))
      .to.be.reverted;
      
    // Real buyer should be able to successfully withdraw refund
    await fundManager_buyer.withdrawRefundAmounts(officialToken.target, [1]);
    
    // Attempting to withdraw again should fail because amount has already been withdrawn
    await expect(fundManager_buyer.withdrawOrderAmounts(officialToken.target, [1]))
      .to.be.reverted;
  });

  // 2, Test if non-minter can withdraw minterRewardAmounts

  it("non-minter withdraw reward-failed", async function () {
    const { 
      truthBox_minter, exchange_minter, exchange_buyer, exchange_other,
      bytes32_buyer, bytes_deliver, fundManager, fundManager_buyer,
      testToken, address_zero, officialToken,
      truthBox,minter,fundManager_completer,fundManager_minter,
    } = await loadFixture(deployTruthBoxFixture);

    // Prepare test environment: sell, buy, complete transaction
    await exchange_minter.sell(2, address_zero, 2000);
    await exchange_buyer.buy(2);
    await exchange_buyer.completeOrder(2);
    
    // Non-minters (here using buyer and other accounts) attempt to withdraw minter rewards, should fail
    await expect(fundManager_buyer.withdrawMinterRewards(officialToken.target))
      .to.be.revertedWithCustomError(fundManager, "AmountIsZero");
      
    await expect(fundManager_completer.withdrawMinterRewards(officialToken.target))
      .to.be.revertedWithCustomError(fundManager, "AmountIsZero");
      
    // Real minter should be able to successfully withdraw rewards
    await fundManager_minter.withdrawMinterRewards(officialToken.target);
    
    // Attempting to withdraw again should fail because amount has already been withdrawn
    await expect(fundManager_minter.withdrawMinterRewards(officialToken.target))
      .to.be.revertedWithCustomError(fundManager, "AmountIsZero");
  });

  // 3, Test if buyer can withdraw withdrawOrderAmounts

  it("buyer withdraw order amount-failed", async function () {
    const { 
      truthBox_minter, exchange_minter, exchange_buyer, exchange_buyer2, exchange_other,
      testToken, address_zero, officialToken,
      bytes32_buyer, fundManager, exchange,buyer2,fundManager_buyer2,fundManager_buyer
    } = await loadFixture(deployTruthBoxFixture);

    // Prepare test environment: sell and auction, but not finally purchased
    await exchange_minter.auction(3, address_zero, 2000);
    
    // Multiple accounts bid
    await exchange_buyer.bid(3);
    await exchange_buyer2.bid(3);
    
    // Verify current buyer is other account (last bidder)
    expect(await exchange.buyerOf(3)).to.equal(buyer2.address);
    
    // Current buyer attempts to withdraw order amount, should fail
    await expect(fundManager_buyer2.withdrawOrderAmounts(officialToken.target, [3]))
      .to.be.revertedWithCustomError(fundManager, "InvalidCaller");
      
    // Previous bidder who has been replaced can withdraw their order amount
    await fundManager_buyer.withdrawOrderAmounts(officialToken.target, [3]);
    
    // Create a new auction
    await exchange_minter.auction(4, address_zero, 3000);
    
    // Buyer bids but has not been replaced yet
    await exchange_buyer.bid(4);
    
    // Buyer attempts to withdraw own order amount, should fail
    await expect(fundManager_buyer.withdrawOrderAmounts(officialToken.target, [4]))
      .to.be.revertedWithCustomError(fundManager, "InvalidCaller");
    
    // Accounts that are not bidders should also be unable to withdraw (amount is 0)
    await expect(fundManager_buyer2.withdrawOrderAmounts(officialToken.target, [4]))
      .to.be.revertedWithCustomError(fundManager, "AmountIsZero");
  });

  it("test adjusting fee rate-transaction funds", async function () { 
    const { 
      truthBox, exchange_minter, exchange_buyer, exchange_buyer2, exchange_other,
      officialToken, exchange_DAO, truthBox_DAO, fundManager_DAO,buyer, truthBox_buyer,
      bytes32_buyer, fundManager, exchange,buyer2,fundManager_buyer2,fundManager_buyer,
      address_zero,
    } = await loadFixture(deployTruthBoxFixture);

    // Adjust fee rate
    await exchange_DAO.setBidIncrementRate(150);
    await truthBox_DAO.setIncrementRate(150);

    // Auction completed,
    await exchange_minter.auction(1, address_zero, 2000);
    // await exchange_buyer2.bid(1);
    await exchange_buyer.bid(1);

    await time.increase(35*24*60*60);
    await exchange_buyer.completeOrder(1);

    // Verify if price is 3000
    expect (await truthBox.getPrice(1)).to.equal(3000);
    
    // Pay confidential fee
    await time.increase(340*24*60*60);
    const balance_buyer_1 = await officialToken.balanceOf(buyer.address)
    await truthBox_buyer.payConfiFee(1);
    const balance_buyer_2 = await officialToken.balanceOf(buyer.address)

    await time.increase(365*24*60*60);
    expect(balance_buyer_1-balance_buyer_2).to.equal(3000);
    await truthBox_buyer.payConfiFee(1);
    const balance_buyer_3 = await officialToken.balanceOf(buyer.address)
    expect(balance_buyer_2-balance_buyer_3).to.equal(4500);

  });

});

