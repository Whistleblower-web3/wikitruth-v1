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

describe("SwapContract test --- basic functions", function () {

  it("16- basic functions", async function () {
    const { 
      exchange_minter,exchange_buyer, exchange_buyer2, buyer, buyer2, bytes32_buyer, wBTC,
      settlementToken, truthBox, truthBox_DAO, address_zero, minter, dao_fund_manager, admin,
      fundManager, exchange,fundManager_buyer2,fundManager_buyer, fundManager_minter,
      swapContract, swapContract_minter, swapContract_buyer, swapContract_other,
    } = await loadFixture(deployTruthBoxFixture);

    const amountIn = await swapContract_minter.getSwapAmountIn(wBTC.target, settlementToken.target, 10000);
    console.log("amountIn:", amountIn);

    const liquidity0 = await swapContract_minter.liquidity(wBTC.target);
    console.log("liquidity:", liquidity0);

    const liquidity1 = await swapContract_minter.liquidity(settlementToken.target);
    console.log("liquidity:", liquidity1);

    const liquidity = await swapContract_minter.liquidity(admin.address);
    console.log("admin liquidity:", liquidity);

  });

  it("16- swapExact - getSwapAmountOut", async function () {
    const { 
      exchange_minter,exchange_buyer, exchange_buyer2, buyer, buyer2, bytes32_buyer, wBTC,
      settlementToken, truthBox, truthBox_DAO, address_zero, minter, dao_fund_manager,
      fundManager, exchange,fundManager_buyer2,fundManager_buyer, fundManager_minter,
      swapContract, swapContract_minter, swapContract_buyer, swapContract_other,
    } = await loadFixture(deployTruthBoxFixture);

    console.log("-----------------input 10000 settlementToken-----------------");

    const token_1_balance = Number(await settlementToken.balanceOf(minter.address));
    console.log("before swap, token_1 balance:", token_1_balance);
    const token_2_balance = Number(await wBTC.balanceOf(minter.address));
    console.log("before swap, tokenOut balance:", token_2_balance);

    const amountOut = await swapContract_minter.getSwapAmountOut(settlementToken.target, wBTC.target, 10000);
    console.log("amountOut predicted value (obtained testToken数量):", amountOut);

    await swapContract_minter.swapExact(settlementToken.target, wBTC.target, 10000);

    const token_1_balance_after = Number(await settlementToken.balanceOf(minter.address));
    console.log("after swap, token_1 balance:", token_1_balance_after);
    const token_2_balance_after = Number(await wBTC.balanceOf(minter.address));
    console.log("after swap, tokenOut balance:", token_2_balance_after);

    expect(token_1_balance_after).to.equal(token_1_balance - 10000);

    console.log("amount of testToken obtained in this transaction:", token_2_balance_after - token_2_balance);
    // check if the predicted value is correct
    expect(amountOut).to.equal(token_2_balance_after - token_2_balance);

  })

  it("16- swapForExact - getSwapAmountIn", async function () {
    const { 
      exchange_minter,exchange_buyer, exchange_buyer2, buyer, buyer2, bytes32_buyer, wBTC,
      settlementToken, truthBox, truthBox_DAO, address_zero, minter, dao_fund_manager,
      fundManager, exchange,fundManager_buyer2,fundManager_buyer, fundManager_minter,
      swapContract, swapContract_minter, swapContract_buyer, swapContract_other,
    } = await loadFixture(deployTruthBoxFixture);

    console.log("-----------------output 10000 settlementToken-----------------");

    const token_1_balance = Number(await settlementToken.balanceOf(minter.address));
    console.log("before swap, token_1 balance:", token_1_balance);
    const token_2_balance = Number(await wBTC.balanceOf(minter.address));
    console.log("before swap, tokenOut balance:", token_2_balance);

    const amountIn = await swapContract_minter.getSwapAmountIn(wBTC.target, settlementToken.target, 10000);
    console.log("amountIn predicted value (consumed testToken amount):", amountIn);

    await swapContract_minter.swapForExact(wBTC.target, settlementToken.target, 10000);

    const token_1_balance_after = Number(await settlementToken.balanceOf(minter.address));
    console.log("after swap, token_1 balance:", token_1_balance_after);
    const token_2_balance_after = Number(await wBTC.balanceOf(minter.address));
    console.log("after swap, tokenOut balance:", token_2_balance_after);

    expect(token_1_balance_after).to.equal(token_1_balance + 10000);

    console.log("amount of testToken consumed in this transaction:", token_2_balance - token_2_balance_after);
    // check if the predicted value is correct
    expect(amountIn).to.equal(token_2_balance - token_2_balance_after);

  })




});

