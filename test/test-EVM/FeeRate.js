const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { deployTruthBoxFixture} = require("./Fixture.js");

describe("FundManager_FeeRate", function () {

  it("dao sets fee rate---success", async function () {
    const { 
      admin, admin2, dao, minter, seller, buyer, completer, other, other2,
      fundManager_DAO,truthBox_DAO,truthBox_minter, exchange_DAO, exchange_minter,
      fundManager, exchange, dao_fund_manager,
    } = await loadFixture(deployTruthBoxFixture);
    
    await fundManager_DAO.setServiceFeeRate(10);
    await exchange_DAO.setBidIncrementRate(101);
    await fundManager_DAO.setHelperRewardRate(5);
    // Check if confidential fee rate equals
    expect(await fundManager.helperRewardRate()).to.equal(5);
    expect(await fundManager.serviceFeeRate()).to.equal(10);
    expect(await exchange_minter.bidIncrementRate()).to.equal(101);

    // ==============================Non-DAO setting fails=================================
    const feeRateMinter = await fundManager.connect(minter);
    // Call set confidential fee rate function, should throw exception
    await expect(feeRateMinter.setServiceFeeRate(10)).to.be.revertedWithCustomError(fundManager,"NotDAO");
    await expect(exchange_minter.setBidIncrementRate(101)).to.be.revertedWithCustomError(exchange_minter,"NotDAO");
    await expect(feeRateMinter.setHelperRewardRate(5)).to.be.revertedWithCustomError(fundManager,"NotDAO");

    // =======================Check again===========================
    expect(await fundManager.helperRewardRate()).to.equal(5);
    expect(await fundManager.serviceFeeRate()).to.equal(10);
    expect(await exchange_minter.bidIncrementRate()).to.equal(101);
  }); 

  it("check if fees are correct", async function () {
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

    // ========================== Buy 1 ==========================
    await exchange_buyer.buy(1);
    await exchange_buyer.buy(2);

    await time.increase(50 * 24 * 60 * 60);

    // ============================== Complete 1 ==================================
    await exchange_buyer.completeOrder(1);

    // Check order amount for order 1
    const orderAmounts_1_buyer = await fundManager.orderAmounts(1, buyer.address);
    expect(orderAmounts_1_buyer).to.equal(0);
    // Check minter income for order 1
    const incomeMinter = await fundManager.minterRewardAmounts( officialToken.target,minter.address);
    expect(incomeMinter).to.equal(1940); // 2000-2000*3%*2 = 1940
    // Check DAO income (service fee) for order 1
    expect(await officialToken.balanceOf(dao_fund_manager.address)).to.equal(60);

    // ========================== Complete 2 ==========================
    await exchange.completeOrder(2);
    expect(await fundManager.helperRewardAmounts( officialToken.target,buyer.address)).to.equal(0);
    // Check if completer is admin
    expect(await exchange.completerOf(2)).to.equal(admin.address);
    const incomeCompleterA = await fundManager.helperRewardAmounts( officialToken.target,admin.address);
    const incomeMinter02 = await fundManager.minterRewardAmounts(officialToken.target,minter.address);
    expect(incomeCompleterA).to.equal(10);
    expect(incomeMinter02).to.equal(2900);

    // ========================== Pay confidential fee ==========================
    await expect(truthBox_buyer.payConfiFee(1)).to.be.revertedWithCustomError(truthBox,"DeadlineNotIn30days");
    // Must be within 30 days of deadline
    await time.increase(340 * 24 * 60 * 60);

    const price01 = await truthBox.getPrice(1);
    expect(price01).to.equal(2000); 
    await truthBox_buyer.payConfiFee(1); // After payment, price becomes 4000, service fee 2000*5%=100
    const price02 = await truthBox.getPrice(1);
    expect(price02).to.equal(4000);
    

    // ============================ Total transaction 5000, order 1: 2000+2000, order 2: 1000 ===================================
    // Fee rate is 3%, 1000*3% = 30*5=150
    expect(await officialToken.balanceOf(dao_fund_manager.address)).to.equal(150);


  });

  
});

