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

describe("Swap1---test", function () {
  

  it("01-minter sell---buyer---pay delay fee--- check deadline, price, status", async function () {
    const { 
      admin, dao, minter, buyer, settlementToken, 
      truthBox, exchange, fundManager, 
      DAY, MONTH, YEAR,
      exchange_minter,exchange_DAO, exchange_buyer, truthBox_buyer, 
      address_zero, bytes_deliver,bytes32_1 ,dao_fund_manager
    } = await loadFixture(deployTruthBoxFixture);

    await time.increase(MONTH);// 30 days
    
    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.sell(2, address_zero, 1000);

    // ==========  Check box 1 and 2 deadline  ===
    const deadline_01 = Number(await truthBox.getDeadline(1));
    const deadline_02 = Number(await truthBox.getDeadline(2));
    // The timestamp now /1000+360 days
    const now = await time.latest();
    console.log("Swap1-01-current block.timestamp:", timestampToDate(now));
    console.log("Swap1-01-deadline_01:", timestampToDate(deadline_01));
    console.log("Swap1-01-deadline_02:", timestampToDate(deadline_02)); 
    // 365 days === YEAR
    TimeHelpers.verifyDeadline(
      deadline_01,
      now,
      YEAR
    );

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

    // ========================== Check if it is within the refund time ==========================
    expect(await exchange.isInRequestRefundDeadline(1)).to.equal(true);
    expect(await exchange.isInRequestRefundDeadline(2)).to.equal(true);

    await time.increase(50 * 24 * 60 * 60);

    expect(await exchange.isInRequestRefundDeadline(1)).to.equal(false);
    expect(await exchange.isInRequestRefundDeadline(2)).to.equal(false);

    // ========================== Time, status, price ==========================
    
    // Check whether the status of No. 1 is 2
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Paid);
    const deadline_01_2 = Number(await truthBox.getDeadline(1));
    expect(deadline_01_2).to.equal(deadline_01);

    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Paid);

    const deadline_04 = Number(await truthBox.getDeadline(2));
    expect(deadline_04).to.equal(deadline_02);

    // Check if the buyer is a buyer
    expect(await exchange.buyerOf(1)).to.equal(buyer.address);
    // Check if the order amount is 2000
    expect(await fundManager.orderAmounts(1, buyer.address)).to.equal(2000);
    
    // ============================== Complete 1 ==================================
    await exchange_buyer.completeOrder(1);
    // Check if the status of number 1 is 4
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Delaying);

    const orderAmounts_1_buyer = await fundManager.orderAmounts(1, buyer.address);
    expect(orderAmounts_1_buyer).to.equal(0);
    const incomeMinter = await fundManager.minterRewardAmounts(settlementToken.target,minter.address);
    // Fee rate is 3% ， 2000*3% = 60
    expect(await settlementToken.balanceOf(dao_fund_manager.address)).to.equal(60);
    expect(incomeMinter).to.equal(1940); // 2000-2000*3%*2
    // expect(blanceOf_daoFund).to.equal(100); // 2000*5%

    // ========================== Complete 2 ==========================
    await exchange.completeOrder(2);
    // chenk completer is admin
    expect(await exchange.completerOf(2)).to.equal(admin.address);
    const incomeCompleterA = await fundManager.helperRewardAmounts( settlementToken.target,admin.address);
    const incomeMinter02 = await fundManager.minterRewardAmounts(settlementToken.target,minter.address);
    console.log("Swap1-01-incomeCompleter02A:", incomeCompleterA);
    console.log("Swap1-01-incomeMinter02:", incomeMinter02);

    // ========================== Pay late fees ==========================
    await time.increase(340 * 24 * 60 * 60);
    const price01 = await truthBox.getPrice(1);
    console.log("Swap1-01-price01_before pay:", price01);
    const deadline_05 = Number(await truthBox.getDeadline(1));
    console.log("Swap1-01-deadline_05_after pay:", timestampToDate(deadline_05));
    await truthBox_buyer.delay(1);
    const price02 = await truthBox.getPrice(1);
    console.log("Swap1-01-price02 after pay:", price02);
    const deadline_06 = Number(await truthBox.getDeadline(1));
    console.log("Swap1-01-deadline_06 after pay:", timestampToDate(deadline_06));
    

    // ============================ total 5000，box 1:2000+2000，box 2:1000 ===================================
    expect(await settlementToken.balanceOf(dao_fund_manager.address)).to.equal(150);

    expect(await fundManager.helperRewardAmounts( settlementToken.target,buyer.address)).to.equal(0);

  });

  it("02-minter-auction-buyer-bid---check deadline price status", async function () {
    const { admin, dao, minter, buyer, settlementToken, buyer2, truthBox, exchange, fundManager_buyer ,
      bytes_deliver, bytes32_1,bytes_mint ,YEAR,MONTH, address_zero,
      exchange_minter,exchange_DAO,exchange_buyer,exchange_buyer2,
    } = await loadFixture(deployTruthBoxFixture);
    
    await exchange_minter.auction(1, address_zero, 2000);
    // Check whether the deadline of No. 1 and No. 2 is equal to the current time plus 365 days
    const deadline_01 = Number(await truthBox.getDeadline(1));
    // Get the current block time: current timestamp/1000+360 days
    const now = await time.latest();
    console.log("Swap1- current block.timestamp:", timestampToDate(now));
    console.log("Swap1-deadline_01:", timestampToDate(deadline_01));
    // 30
    TimeHelpers.verifyDeadline(
      deadline_01,
      now,
      MONTH
    );

    expect(await truthBox.getPrice(1)).to.equal(2000);
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Auctioning);

    // ========================== bid 1 ==========================
    await time.increase(20 * 24 * 60 * 60);

    await exchange_buyer.bid(1);
    expect(await exchange.buyerOf(1)).to.equal(buyer.address);
    // Check if the time is delayed
    const deadline_02 = Number(await truthBox.getDeadline(1));
    const now02 = await time.latest();
    console.log("Swap1- current block.timestamp:", timestampToDate(now02));
    console.log("Swap1-deadline_02 bid 1:", timestampToDate(deadline_02));
    expect(await truthBox.getPrice(1)).to.equal(2200);


    // ========================== bid 2 ==========================
    await time.increase(20 * 24 * 60 * 60);

    await exchange_buyer2.bid(1);
    expect(await exchange.buyerOf(1)).to.equal(buyer2.address);
    const deadline_03 = Number(await truthBox.getDeadline(1));
    const now03 = await time.latest();
    console.log("Swap1-current block.timestamp::", timestampToDate(now03));
    console.log("Swap1-deadline_03 bid 2:", timestampToDate(deadline_03));
    expect(await truthBox.getPrice(1)).to.equal(2420);


    // ========================== bid 3 ==========================
    await time.increase(20 * 24 * 60 * 60);
    const price = await truthBox.getPrice(1);
    console.log("Swap1-price after bid 2t:", price);
    const payMoney_buyer = await exchange_buyer.calcPayMoney(1)
    console.log("Swap1-buyer need pay in 2t bid:", payMoney_buyer);
    await exchange_buyer.bid(1);
    expect(await exchange.buyerOf(1)).to.equal(buyer.address);

    // ========================== bid 4 ==========================
    await time.increase(20 * 24 * 60 * 60);
    console.log("Swap1-price after bid 3s:", await truthBox.getPrice(1));
    console.log("Swap1-other need pay in second bid:", await exchange_buyer2.calcPayMoney(1));
    await exchange_buyer2.bid(1);

    // ==========================  ==========================
    await time.increase(40 * 24 * 60 * 60);
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Paid);

    const deadline_04 = Number(await truthBox.getDeadline(1));
    console.log("Swap1-deadline_04:", timestampToDate(deadline_04));
    expect(await exchange.buyerOf(1)).to.equal(buyer2.address);

    // ========================== withdraw ============================
    console.log("Swap1-buyer before withdraw orderAmount:", await fundManager_buyer.orderAmounts(1, buyer.address));
    await fundManager_buyer.withdrawOrderAmounts(settlementToken.target, [1]);
    console.log("Swap1-buyer after withdraw orderAmount:", await fundManager_buyer.orderAmounts(1, buyer.address));

    await exchange_buyer2.completeOrder(1);
    // Check whether the status of No. 1 is delaying
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Delaying);

  });

  it("03-minter--auction--bid--multi roles", async function () {
    const { admin, dao, minter, buyer, settlementToken, other, truthBox, 
      exchange_minter, exchange_buyer,exchange_DAO,fundManager_buyer,fundManager_minter,
      dao_fund_manager, fundManager_DAO,fundManager_dao_fund_manager, address_zero,
      fundManager,bytes32_1,bytes_mint ,bytes_deliver} = await loadFixture(deployTruthBoxFixture);

    await exchange_minter.auction(1, address_zero, 1000);

    await time.increase(25 * 24 * 60 * 60);

    await exchange_buyer.bid(1);

    await time.increase(40 * 24 * 60 * 60);
    // The administrator confirmed that additional rates will be added

    // ========================== complete ==========================
    await exchange_buyer.completeOrder(1);
    // Check if the status of number 1 is 5
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Delaying);
    // Check the income of each account
    // minter income 1000-1000*3% = 970
    const incomeMinter = await fundManager.minterRewardAmounts(settlementToken.target,minter.address);
    expect(incomeMinter).to.equal(970);
    expect(await settlementToken.balanceOf(dao_fund_manager.address)).to.equal(30);

    // Check the balance of the contract, a service fee of 50 has been paid
    const balancefundManager = await settlementToken.balanceOf(fundManager.target);
    expect(balancefundManager).to.equal(970);

    // ==========================  error==========================
    await expect(fundManager_buyer.withdrawRefundAmounts(settlementToken.target, [1])).to.be.reverted;
    
    // ========================== withdraw minter==========================
    const balanceMinter = await settlementToken.balanceOf(minter.address);
    await fundManager_minter.withdrawMinterRewards(settlementToken.target);
    const balanceMinter02 = await settlementToken.balanceOf(minter.address);
    console.log("Swap1-03-Minter withdraw:", balanceMinter02-balanceMinter);
    // Withdraw money again, an exception should be thrown
    await expect(fundManager_minter.withdrawMinterRewards(settlementToken.target)).to.be.reverted;
    // await expect(fundManager_minter.withdrawSeller()).to.be.reverted(exchange,"AmountIsZero");

    // //========================== Withdrawing DAO should not be possible ==========================

    await expect(fundManager_DAO.withdrawHelperRewards(settlementToken.target)).to.be.reverted;

    // ========================== Verification service fee ==========================
    expect(await settlementToken.balanceOf(dao_fund_manager.address)).to.equal(30);
    // ==================Withdraw money again, an exception should be thrown==========
    // Check the balance of the contract
    const balancefundManager01 = await settlementToken.balanceOf(fundManager.target);
    console.log("Swap1-03-fundManager balanceOf:", balancefundManager01);

  });

});


