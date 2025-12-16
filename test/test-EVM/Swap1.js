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

describe("Trading Test - Regular Trading Test", function () {
  // Destructure variables for unit testing
  

  it("01-minter sells-buyer buys-pay confidential fee- check time-price-status", async function () {
    const { 
      admin, dao, minter, buyer, officialToken, 
      truthBox, exchange, fundManager, 
      DAY, MONTH, YEAR,
      exchange_minter,exchange_DAO, exchange_buyer, truthBox_buyer, 
      address_zero, bytes_deliver,bytes32_1 ,dao_fund_manager
    } = await loadFixture(deployTruthBoxFixture);

    // Increase time by 360 days
    await time.increase(MONTH);
    
    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.sell(2, address_zero, 1000);

    // ==========  Check if deadlines for 1 and 2 equal current time plus 365 days ===
    const deadline_01 = Number(await truthBox.getDeadline(1));
    const deadline_02 = Number(await truthBox.getDeadline(2));
    // Get current block time: current timestamp/1000+360 days
    const now = await time.latest();
    console.log("Swap1-01-Current block time:", timestampToDate(now));
    console.log("Swap1-01-deadline_01 expiration time:", timestampToDate(deadline_01));
    console.log("Swap1-01-deadline_02 expiration time:", timestampToDate(deadline_02)); // After subtracting current block time, exactly 365 days
    // Use helper function to verify time
    TimeHelpers.verifyDeadline(
      deadline_01,
      now,
      YEAR
    );

    // Use helper function to verify time
    TimeHelpers.verifyDeadline(
      deadline_02,
      now,
      YEAR
    );

    // Check price
    expect(await truthBox.getPrice(1)).to.equal(2000);
    expect(await truthBox.getPrice(2)).to.equal(1000);

    // Check if status is 1
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Selling);
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Selling);

    // Check seller should be empty
    expect(await exchange.sellerOf(1)).to.equal(address_zero);
    expect(await exchange.sellerOf(2)).to.equal(address_zero);

    // ========================== Buy 1 ==========================
    await exchange_buyer.buy(1);
    await exchange_buyer.buy(2);

    // ========================== Check if within refund deadline ==========================
    expect(await exchange.isInRequestRefundDeadline(1)).to.equal(true);
    expect(await exchange.isInRequestRefundDeadline(2)).to.equal(true);

    await time.increase(50 * 24 * 60 * 60);

    expect(await exchange.isInRequestRefundDeadline(1)).to.equal(false);
    expect(await exchange.isInRequestRefundDeadline(2)).to.equal(false);

    // ========================== Time, status, price ==========================
    
    // Check if status of 1 is 2
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Paid);
    const deadline_01_2 = Number(await truthBox.getDeadline(1));
    expect(deadline_01_2).to.equal(deadline_01);

    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Paid);

    const deadline_04 = Number(await truthBox.getDeadline(2));
    expect(deadline_04).to.equal(deadline_02);

    // Check if buyer is buyer
    expect(await exchange.buyerOf(1)).to.equal(buyer.address);
    // Check if order amount is 2000
    expect(await fundManager.orderAmounts(1, buyer.address)).to.equal(2000);
    
    // ============================== Complete 1 ==================================
    await exchange_buyer.completeOrder(1);
    // Check if status of 1 is 4
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.InSecrecy);

    // Check order 1
    const orderAmounts_1_buyer = await fundManager.orderAmounts(1, buyer.address);
    expect(orderAmounts_1_buyer).to.equal(0);
    const incomeMinter = await fundManager.minterRewardAmounts(officialToken.target,minter.address);
    // Fee rate is 3%, 2000*3% = 60
    expect(await officialToken.balanceOf(dao_fund_manager.address)).to.equal(60);
    expect(incomeMinter).to.equal(1940); // 2000-2000*3%*2
    // expect(blanceOf_daoFund).to.equal(100); // 2000*5%

    // ========================== Complete 2 ==========================
    await exchange.completeOrder(2);
    // Check if completer is admin
    expect(await exchange.completerOf(2)).to.equal(admin.address);
    const incomeCompleterA = await fundManager.helperRewardAmounts( officialToken.target,admin.address);
    const incomeMinter02 = await fundManager.minterRewardAmounts(officialToken.target,minter.address);
    console.log("Swap1-01-incomeCompleter02A:", incomeCompleterA);
    console.log("Swap1-01-incomeMinter02:", incomeMinter02);

    // ========================== Pay confidential fee ==========================
    await time.increase(340 * 24 * 60 * 60);
    const price01 = await truthBox.getPrice(1);
    console.log("Swap1-01-price01 before payment:", price01);
    const deadline_05 = Number(await truthBox.getDeadline(1));
    console.log("Swap1-01-deadline_05 after payment:", timestampToDate(deadline_05));
    await truthBox_buyer.payConfiFee(1);
    const price02 = await truthBox.getPrice(1);
    console.log("Swap1-01-price02 after payment:", price02);
    const deadline_06 = Number(await truthBox.getDeadline(1));
    console.log("Swap1-01-deadline_06 after payment:", timestampToDate(deadline_06));
    

    // ============================ Total transaction 5000, order 1: 2000+2000, order 2: 1000 ===================================
    expect(await officialToken.balanceOf(dao_fund_manager.address)).to.equal(150);

    expect(await fundManager.helperRewardAmounts( officialToken.target,buyer.address)).to.equal(0);

  });

  it("02-minter auction-buyer bidding-check time-price-status", async function () {
    const { admin, dao, minter, buyer, officialToken, buyer2, truthBox, exchange, fundManager_buyer ,
      bytes_deliver, bytes32_1,bytes_mint ,YEAR,MONTH, address_zero,
      exchange_minter,exchange_DAO,exchange_buyer,exchange_buyer2,
    } = await loadFixture(deployTruthBoxFixture);
    
    await exchange_minter.auction(1, address_zero, 2000);
    // Check if deadlines for 1 and 2 equal current time plus 365 days
    const deadline_01 = Number(await truthBox.getDeadline(1));
    // Get current block time: current timestamp/1000+360 days
    const now = await time.latest();
    console.log("Swap1-Current block time:", timestampToDate(now));
    console.log("Swap1-deadline_01 expiration time:", timestampToDate(deadline_01));
    // Use helper function to verify time
    TimeHelpers.verifyDeadline(
      deadline_01,
      now,
      MONTH
    );

    // Check if prices of 1, 2 are 2000
    expect(await truthBox.getPrice(1)).to.equal(2000);
    // Check if status of 1, 2 is 1
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Auctioning);

    // ========================== Bid 1 ==========================
    await time.increase(20 * 24 * 60 * 60);

    await exchange_buyer.bid(1);
    // Check
    expect(await exchange.buyerOf(1)).to.equal(buyer.address);
    // Check if time is delayed
    const deadline_02 = Number(await truthBox.getDeadline(1));
    // Get current block time: current timestamp/1000+360 days
    const now02 = await time.latest();
    console.log("Swap1-Current block time:", timestampToDate(now02));
    console.log("Swap1-deadline_02 after 1 bid:", timestampToDate(deadline_02));
    expect(await truthBox.getPrice(1)).to.equal(2200);


    // ========================== Bid 2 ==========================
    await time.increase(20 * 24 * 60 * 60);

    await exchange_buyer2.bid(1);
    // Check
    expect(await exchange.buyerOf(1)).to.equal(buyer2.address);
    // Check if time is delayed
    const deadline_03 = Number(await truthBox.getDeadline(1));
    // Get current block time: current timestamp/1000+360 days
    const now03 = await time.latest();
    console.log("Swap1-Current block time:", timestampToDate(now03));
    console.log("Swap1-deadline_03 after 2 bids:", timestampToDate(deadline_03));
    expect(await truthBox.getPrice(1)).to.equal(2420);


    // ========================== Bid 3 ==========================
    // buyer second bid
    await time.increase(20 * 24 * 60 * 60);
    const price = await truthBox.getPrice(1);
    console.log("Swap1-Price after two bids:", price);
    const payMoney_buyer = await exchange_buyer.calcPayMoney(1)
    console.log("Swap1-Funds buyer needs to pay for second bid:", payMoney_buyer);
    await exchange_buyer.bid(1);
    // Check
    expect(await exchange.buyerOf(1)).to.equal(buyer.address);

    // ========================== Bid 4 ==========================
    // other second bid
    await time.increase(20 * 24 * 60 * 60);
    console.log("Swap1-Price after three bids:", await truthBox.getPrice(1));
    console.log("Swap1-Funds other needs to pay for second bid:", await exchange_buyer2.calcPayMoney(1));
    await exchange_buyer2.bid(1);

    // ==========================  ==========================

    await time.increase(40 * 24 * 60 * 60);

    // Check if status of 1 is 3
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Paid);
    const deadline_04 = Number(await truthBox.getDeadline(1));
    console.log("Swap1-deadline_04 after delivery:", timestampToDate(deadline_04));
    expect(await exchange.buyerOf(1)).to.equal(buyer2.address);

    // ========================== Withdraw ============================
    // buyer bid failed, withdraw funds
    console.log("Swap1-buyer orderAmount before withdrawal:", await fundManager_buyer.orderAmounts(1, buyer.address));
    await fundManager_buyer.withdrawOrderAmounts(officialToken.target, [1]);
    console.log("Swap1-buyer orderAmount after withdrawal:", await fundManager_buyer.orderAmounts(1, buyer.address));

    // ========================== Complete ==========================
    await exchange_buyer2.completeOrder(1);
    // Check if status of 1 is 5
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.InSecrecy);

  });

  it("03-minter auction-bidding--multiple roles withdraw funds", async function () {
    const { admin, dao, minter, buyer, officialToken, other, truthBox, 
      exchange_minter, exchange_buyer,exchange_DAO,fundManager_buyer,fundManager_minter,
      dao_fund_manager, fundManager_DAO,fundManager_dao_fund_manager, address_zero,
      fundManager,bytes32_1,bytes_mint ,bytes_deliver} = await loadFixture(deployTruthBoxFixture);

    // Increase deadline by 30 days, total 60 days, pay service fee
    await exchange_minter.auction(1, address_zero, 1000);

    // ========================== Bid 1 ==========================
    await time.increase(25 * 24 * 60 * 60);

    await exchange_buyer.bid(1);

    // ========================== Deliver ==========================
    await time.increase(40 * 24 * 60 * 60);
    // Admin confirmation will add extra fee rate

    // ========================== Complete ==========================
    await exchange_buyer.completeOrder(1);
    // Check if status of 1 is 5
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.InSecrecy);
    // Check income of each account
    // minter income 1000-1000*3% = 970
    const incomeMinter = await fundManager.minterRewardAmounts(officialToken.target,minter.address);
    expect(incomeMinter).to.equal(970);
    // Fee rate is 3%, 1000*3% = 30
    expect(await officialToken.balanceOf(dao_fund_manager.address)).to.equal(30);

    // Check contract balance, 50 service fee already paid
    const balancefundManager = await officialToken.balanceOf(fundManager.target);
    expect(balancefundManager).to.equal(970);

    // ========================== Withdraw refund buyer==========================
    // Withdrawal should throw exception
    await expect(fundManager_buyer.withdrawRefundAmounts(officialToken.target, [1])).to.be.reverted;
    
    // ========================== Withdraw minter==========================
    const balanceMinter = await officialToken.balanceOf(minter.address);
    await fundManager_minter.withdrawMinterRewards(officialToken.target);
    const balanceMinter02 = await officialToken.balanceOf(minter.address);
    console.log("Swap1-03-Minter withdrew:", balanceMinter02-balanceMinter);
    // Withdraw again should throw exception
    await expect(fundManager_minter.withdrawMinterRewards(officialToken.target)).to.be.reverted;
    // await expect(fundManager_minter.withdrawSeller()).to.be.reverted(exchange,"AmountIsZero");

    // // ========================== Withdraw DAO should not be able to withdraw==========================

    await expect(fundManager_DAO.withdrawHelperRewards(officialToken.target)).to.be.reverted;

    // ========================== Verify service fee ==========================
    expect(await officialToken.balanceOf(dao_fund_manager.address)).to.equal(30);
    // ==================Withdraw again should throw exception==========
    // Check contract balance
    const balancefundManager01 = await officialToken.balanceOf(fundManager.target);
    console.log("Swap1-03-fundManager contract balance:", balancefundManager01);

  });

});


