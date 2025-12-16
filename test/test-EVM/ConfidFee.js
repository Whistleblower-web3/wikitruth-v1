const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { deployTruthBoxFixture} = require("./Fixture.js");
const {timestampToDate} = require('../utils/timeToDate.js');
/**
 * Test contract: TruthBox.sol
 * Main test content:
 * 1. Set confidential fee rate
 * 2. Pay confidential fee
 * 3. Extend confidentiality time
 */

describe("TruthBox-ConfidentialityFee- Related Tests", async function () {


  it("set confidential fee rate", async function () {
    const { 
      truthBox, fundManager, exchange,truthBox_DAO,truthBox_minter
    } = await loadFixture(deployTruthBoxFixture);

    // Default rate
    const incrementRate = Number(await truthBox.incrementRate());
    expect(incrementRate).to.equal(200);

    // Set rate
    await truthBox_DAO.setIncrementRate(150);
    const incrementRate1 = Number(await truthBox.incrementRate());
    expect(incrementRate1).to.equal(150);

    await truthBox_DAO.setIncrementRate(200);
    const incrementRate2 = Number(await truthBox.incrementRate());
    expect(incrementRate2).to.equal(200);
    // Setting value greater than 200 should fail
    await expect(truthBox_DAO.setIncrementRate(201)).to.be.revertedWithCustomError(truthBox,"InvalidRate");

    // Setting 0 should fail
    await expect(truthBox_DAO.setIncrementRate(0)).to.be.revertedWithCustomError(truthBox,"InvalidRate");

    // Non-DAO account setting rate should fail
    await expect(truthBox_minter.setIncrementRate(150)).to.be.revertedWithCustomError(truthBox,"NotDAO");
  });  

  

  it("pay confidential fee-extend confidentiality time-cannot pay after expiration", async function () {
    const { 
      buyer, 
      truthBox_minter, truthBox_other, exchange_minter,exchange_buyer,exchange_DAO,
      truthBox_buyer, bytes32_1, officialToken, address_zero, minter,
      truthBox, fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    // =================Sell and complete================
    await exchange_minter.sell(0, address_zero,20000);
    await exchange_minter.sell(1, address_zero,20000);
    // Authorize tokens for `ConfidentialityFee` contract
    await exchange_buyer.buy(0);
    await exchange_buyer.buy(1);

    await exchange_buyer.completeOrder(0);
    await exchange_buyer.completeOrder(1);
    
    // Print buyer account token balance
    const balanceOf_buyer = await officialToken.balanceOf(buyer.address);
    console.log("ConfidFee--feeToken_buyer balance before payment:",balanceOf_buyer.toString());
    ///
    const rewards_minter0 = await fundManager.minterRewardAmounts(officialToken.target,minter.address)
    expect (rewards_minter0).to.equal(38800)
    // =================Check time================
    const deadline01_0 = Number(await truthBox.getDeadline(1)); 
    const deadline00_0 = Number(await truthBox.getDeadline(0)); 
    // =================Payment 1================
    // Call ExtendStoringTime method in payFee_ contract
    await time.increase(340*24*60*60);
    
    await truthBox_buyer.payConfiFee(0);
    await truthBox_buyer.payConfiFee(1);
    const deadline00_1 = Number(await truthBox.getDeadline(0)); 
    const deadline01_1 = Number(await truthBox.getDeadline(1)); 

    // Check if extended by 365 days
    expect(deadline00_1).to.equal(deadline00_0 + 365 * 24 * 60 * 60);
    expect(deadline01_1).to.equal(deadline01_0 + 365 * 24 * 60 * 60);

    // Print buyer account token balance
    const balanceOf_buyer1 = await officialToken.balanceOf(buyer.address);
    console.log("ConfidFee--feeToken_buyer balance after payment——1:",balanceOf_buyer1.toString());
    expect(Number(balanceOf_buyer)-Number(balanceOf_buyer1)).to.equal(40000)
    ///
    const rewards_minter = await fundManager.minterRewardAmounts(officialToken.target,minter.address)
    expect (rewards_minter).to.equal(77600)

    // =================Check if price changed===============
    const price_0 = await truthBox_minter.getPrice(0);
    const price_1 = await truthBox_minter.getPrice(1);
    console.log("ConfidFee--0 price after payment:",price_0);
    console.log("ConfidFee--1 price after payment:",price_1);
    // =================Payment 2================
    // Only pay for one
    await time.increase(365 * 24 * 60 * 60);
    await truthBox_buyer.payConfiFee(0);
    const deadline00_2 = Number(await truthBox.getDeadline(0)); 
    const deadline01_2 = Number(await truthBox.getDeadline(1)); 
    // Only box 0 extended by 365 days
    expect(deadline00_2).to.equal(deadline00_1 + 365 * 24 * 60 * 60);
    expect(deadline01_2).to.equal(deadline01_1);

    // Print buyer account token balance
    const balanceOf_buyer2 = await officialToken.balanceOf(buyer.address);
    console.log("buyer balance after payment——1:",balanceOf_buyer2.toString());
    // Verify if payment was 40000
    expect(Number(balanceOf_buyer1)-Number(balanceOf_buyer2)).to.equal(40000)
    ///
    const rewards_minter2 = await fundManager.minterRewardAmounts(officialToken.target,minter.address)
    expect (rewards_minter2).to.equal(116400)

    // =================Payment 3================
    
    await time.increase(365 * 24 * 60 * 60);
    await truthBox_buyer.payConfiFee(0);
    
    // Time delayed 365 days, cannot extend after expiration
    await expect(truthBox_buyer.payConfiFee(1)).to.be.revertedWithCustomError(truthBox,"DeadlineNotIn30days");

    // Print buyer account token balance
    const balanceOf_buyer3 = await officialToken.balanceOf(buyer.address);
    console.log("buyer balance after payment——2:",balanceOf_buyer3.toString());
    // Verify if payment was 80000
    expect(Number(balanceOf_buyer2)-Number(balanceOf_buyer3)).to.equal(80000)
    // Check minter income
    const rewards_minter3 = await fundManager.minterRewardAmounts(officialToken.target,minter.address)
    expect (rewards_minter3).to.equal(194000)

    const price_0_2 = await truthBox_minter.getPrice(0);
    console.log("ConfidFee--0 price after payment:",price_0_2);

  });

  it("pay confidential fee-add to blacklist-cannot pay", async function () {
    const { 
      buyer, 
      truthBox_minter, truthBox_DAO, exchange_minter,exchange_buyer,exchange_DAO,
      truthBox_buyer, bytes32_1, officialToken,address_zero,
      truthBox, fundManager, exchange
    } = await loadFixture(deployTruthBoxFixture);

    // =================Sell and complete================
    await exchange_minter.sell(0, address_zero,20000);
    // Authorize tokens for `ConfidentialityFee` contract
    await exchange_buyer.buy(0);

    await exchange_buyer.completeOrder(0);

    // =================Check time================
    const deadline00_0 = Number(await truthBox.getDeadline(0)); 
    
    // Add to blacklist
    await truthBox_DAO.addBoxToBlacklist(0);

    // =================Payment 1================
    // Call ExtendStoringTime method in payFee_ contract
    await expect(truthBox_buyer.payConfiFee(0)).to.be.revertedWithCustomError(truthBox,"InvalidStatus");
    const deadline00_1 = Number(await truthBox.getDeadline(0)); 
    expect(deadline00_1).to.equal(deadline00_0);
  });

});

