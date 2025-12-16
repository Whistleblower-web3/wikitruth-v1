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

describe("Exchange Contract Tests-SwapContract", function () {

  it("16- Basic functionality test", async function () {
    const { 
      exchange_minter,exchange_buyer, exchange_buyer2, buyer, buyer2, bytes32_buyer, testToken,
      officialToken, truthBox, truthBox_DAO, address_zero, minter, dao_fund_manager, admin,
      fundManager, exchange,fundManager_buyer2,fundManager_buyer, fundManager_minter,
      swapContract, swapContract_minter, swapContract_buyer, swapContract_other,
    } = await loadFixture(deployTruthBoxFixture);

    const amountIn = await swapContract_minter.getSwapAmountIn(testToken.target, officialToken.target, 10000);
    console.log("amountIn:", amountIn);

    const liquidity0 = await swapContract_minter.liquidity(testToken.target);
    console.log("liquidity:", liquidity0);

    const liquidity1 = await swapContract_minter.liquidity(officialToken.target);
    console.log("liquidity:", liquidity1);

    const liquidity = await swapContract_minter.liquidity(admin.address);
    console.log("admin liquidity:", liquidity);

  });

  it("16- Exchange test-swapExact-getSwapAmountOut", async function () {
    const { 
      exchange_minter,exchange_buyer, exchange_buyer2, buyer, buyer2, bytes32_buyer, testToken,
      officialToken, truthBox, truthBox_DAO, address_zero, minter, dao_fund_manager,
      fundManager, exchange,fundManager_buyer2,fundManager_buyer, fundManager_minter,
      swapContract, swapContract_minter, swapContract_buyer, swapContract_other,
    } = await loadFixture(deployTruthBoxFixture);

    console.log("-----------------Input 10000 officialToken-----------------");

    const token_1_balance = Number(await officialToken.balanceOf(minter.address));
    console.log("token_1 balance before exchange:", token_1_balance);
    const token_2_balance = Number(await testToken.balanceOf(minter.address));
    console.log("tokenOut balance before exchange:", token_2_balance);

    const amountOut = await swapContract_minter.getSwapAmountOut(officialToken.target, testToken.target, 10000);
    console.log("amountOut predicted value (testToken amount received):", amountOut);

    await swapContract_minter.swapExact(officialToken.target, testToken.target, 10000);

    const token_1_balance_after = Number(await officialToken.balanceOf(minter.address));
    console.log("token_1 balance after exchange:", token_1_balance_after);
    const token_2_balance_after = Number(await testToken.balanceOf(minter.address));
    console.log("tokenOut balance after exchange:", token_2_balance_after);

    expect(token_1_balance_after).to.equal(token_1_balance - 10000);

    console.log("testToken amount received in this exchange:", token_2_balance_after - token_2_balance);
    // Test if predicted value is correct
    expect(amountOut).to.equal(token_2_balance_after - token_2_balance);

  })

  it("16- Exchange test-swapForExact-getSwapAmountIn", async function () {
    const { 
      exchange_minter,exchange_buyer, exchange_buyer2, buyer, buyer2, bytes32_buyer, testToken,
      officialToken, truthBox, truthBox_DAO, address_zero, minter, dao_fund_manager,
      fundManager, exchange,fundManager_buyer2,fundManager_buyer, fundManager_minter,
      swapContract, swapContract_minter, swapContract_buyer, swapContract_other,
    } = await loadFixture(deployTruthBoxFixture);

    console.log("-----------------Need to output 10000 officialToken-----------------");

    const token_1_balance = Number(await officialToken.balanceOf(minter.address));
    console.log("token_1 balance before exchange:", token_1_balance);
    const token_2_balance = Number(await testToken.balanceOf(minter.address));
    console.log("tokenOut balance before exchange:", token_2_balance);

    const amountIn = await swapContract_minter.getSwapAmountIn(testToken.target, officialToken.target, 10000);
    console.log("amountIn predicted value (testToken amount consumed):", amountIn);

    await swapContract_minter.swapForExact(testToken.target, officialToken.target, 10000);

    const token_1_balance_after = Number(await officialToken.balanceOf(minter.address));
    console.log("token_1 balance after exchange:", token_1_balance_after);
    const token_2_balance_after = Number(await testToken.balanceOf(minter.address));
    console.log("tokenOut balance after exchange:", token_2_balance_after);

    expect(token_1_balance_after).to.equal(token_1_balance + 10000);

    console.log("testToken amount consumed in this exchange:", token_2_balance - token_2_balance_after);
    // Test if predicted value is correct
    expect(amountIn).to.equal(token_2_balance - token_2_balance_after);

  })




});

