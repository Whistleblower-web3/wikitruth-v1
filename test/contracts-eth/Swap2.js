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

describe("Swap2 test --- multi-role transaction process", function () {

  it("06-overdue sale - seller - buyer - completer - withdraw funds", async function () {
    const { admin, dao, minter, seller, buyer, settlementToken, completer, truthBox, 
      exchange, fundManager ,bytes_mint, bytes_deliver, bytes32_1 , address_zero,
      fundManager_completer,fundManager_DAO,dao_fund_manager, fundManager_dao_fund_manager,
      exchange_seller,exchange_DAO,exchange_buyer,exchange_completer, fundManager_buyer,fundManager_minter,
    } = await loadFixture(deployTruthBoxFixture);

    await time.increase(380 * 24 * 60 * 60);
    // 
    // seller sell will increase extra fee
    await exchange_seller.sell(1, address_zero, 1000);
    await exchange_seller.auction(2, address_zero, 1000);
    // ========================== buy ==========================
    await exchange_buyer.buy(1);
    await exchange_buyer.bid(2);

    // ========================== complete ==========================
    await time.increase(50 * 24 * 60 * 60);
    expect(await exchange.isInRequestRefundDeadline(1)).to.equal(false);
    expect(await exchange.isInRequestRefundDeadline(2)).to.equal(false);
    // completer confirm will increase extra fee
    await exchange_completer.completeOrder(1);
    await exchange_completer.completeOrder(2);
    expect(await exchange.completerOf(1)).to.equal(completer.address);
    expect(await exchange.completerOf(2)).to.equal(completer.address);

    // ========================== check id=1 fund situation ==========================
    const incomeMinter = await fundManager.minterRewardAmounts(settlementToken.target,minter.address);
    // const serviceFee = await fundManager.availableServiceFees();

    const incomeCompleter = await fundManager.helperRewardAmounts(settlementToken.target,completer.address);
    const incomeSeller = await fundManager.helperRewardAmounts(settlementToken.target,seller.address);
    expect(incomeMinter).to.equal(1900);
    // expect(serviceFee).to.equal(100);

    expect(incomeCompleter).to.equal(20);
    expect(incomeSeller).to.equal(20);
    // NOTE service fee 3%
    // check contract balance, 60 service fee has been paid
    const balancefundManager = await settlementToken.balanceOf(fundManager.target);
    expect(balancefundManager).to.equal(1940);

    // ========================== withdraw ==========================
    // const balanceBuyer = await settlementToken.balanceOf(buyer.address);
    await expect(fundManager_buyer.withdrawRefundAmounts(settlementToken.target, [1])).to.be.reverted;
    // const balanceBuyer02 = await settlementToken.balanceOf(buyer.address);
    // expect(balanceBuyer02-balanceBuyer).to.equal(750);

    // ========================== withdraw 2 ==========================
    const balanceMinter = await settlementToken.balanceOf(minter.address);
    await fundManager_minter.withdrawMinterRewards(settlementToken.target);
    const balanceMinter02 = await settlementToken.balanceOf(minter.address);
    expect(balanceMinter02-balanceMinter).to.equal(1900);

    // ========================== withdraw 3 ==========================
    const fundManagerSeller = fundManager.connect(seller);
    const balanceSeller = await settlementToken.balanceOf(seller.address);
    console.log("Swap2-Seller withdraw before:", balanceSeller);
    await fundManagerSeller.withdrawHelperRewards(settlementToken.target);
    const balanceSeller02 = await settlementToken.balanceOf(seller.address);
    console.log("Swap2-Seller withdraw after:", balanceSeller02);

    // ========================== withdraw 4 ==========================
    const balanceCompleter = await settlementToken.balanceOf(completer.address);
    await fundManager_completer.withdrawHelperRewards(settlementToken.target);
    const balanceCompleter02 = await settlementToken.balanceOf(completer.address);
    expect(balanceCompleter02-balanceCompleter).to.equal(20);

    // ========================== withdraw service fee ==========================
    // await fundManager_DAO.withdrawServiceFee(dao_fund_manager.address);
    const balanceDao_fund_manager1 = await settlementToken.balanceOf(dao_fund_manager.address);
    // two boxes, total 60
    expect(balanceDao_fund_manager1).to.equal(60);

    // const serviceFee02 = await fundManager.availableServiceFees();
    // expect(serviceFee02).to.equal(0);
    // check contract balance
    const balancefundManager01 = await settlementToken.balanceOf(fundManager.target);
    // funds have been allocated
    expect(balancefundManager01).to.equal(0); 

  });

  it("07-blacklist, public cannot sell", async function () {
    const { minter, truthBox, exchange_minter, settlementToken ,truthBox_DAO,
      truthBox_minter, address_zero,
    } = await loadFixture(deployTruthBoxFixture);
    
    await truthBox_DAO.addToBlacklist(1);
    await truthBox_DAO.addToBlacklist(2);
    // increase time by 360 days
    await time.increase(360 * 24 * 60 * 60);
    // should throw exception
    await expect(exchange_minter.sell(1, address_zero, 2000)).to.be.reverted;
    await expect(exchange_minter.sell(2, address_zero, 2000)).to.be.reverted;

  });

  it("08-blacklist, public cannot auction", async function () {
    const { minter, truthBox, exchange, settlementToken ,truthBox_DAO,
      truthBox_minter,exchange_seller, address_zero,
    } = await loadFixture(deployTruthBoxFixture);

    await truthBox_DAO.addToBlacklist(1);
    // increase time by 360 days
    await time.increase(360 * 24 * 60 * 60);
    // should throw exception
    await expect(exchange_seller.auction(1, address_zero,  2000)).to.be.reverted;
    await expect(exchange_seller.auction(2, address_zero, 2000)).to.be.reverted;

  });

  it("09-overdue - seller - sell/auction", async function () {
    const { 
      minter, buyer, settlementToken, truthBox, exchange_seller, address_zero, seller,
      fundManager, bytes_mint,bytes32_1 , exchange_minter,exchange,other,
    } = await loadFixture(deployTruthBoxFixture);

    await time.increase(380 * 24 * 60 * 60);
    await exchange_minter.sell(1, address_zero, 2000);
    await exchange_minter.auction(2, address_zero, 3000);
    await exchange_seller.sell(3, address_zero, 2000);
    await exchange_seller.auction(4, address_zero, 4000);

    // check if price is modified
    expect(await truthBox.getPrice(1)).to.equal(2000);
    expect(await truthBox.getPrice(2)).to.equal(3000);
    expect(await truthBox.getPrice(3)).to.equal(1000);
    expect(await truthBox.getPrice(4)).to.equal(1000);
    // check if status is 1
    expect(await truthBox.getStatus(1)).to.equal(TimeHelpers.Status.Selling);
    expect(await truthBox.getStatus(2)).to.equal(TimeHelpers.Status.Auctioning);
    expect(await truthBox.getStatus(3)).to.equal(TimeHelpers.Status.Selling);
    expect(await truthBox.getStatus(4)).to.equal(TimeHelpers.Status.Auctioning);
    // check seller
    expect(await exchange.sellerOf(1)).to.equal(address_zero);
    expect(await exchange.sellerOf(2)).to.equal(address_zero);
    expect(await exchange.sellerOf(3)).to.equal(seller.address);
    expect(await exchange.sellerOf(4)).to.equal(seller.address);

  });

  
});

