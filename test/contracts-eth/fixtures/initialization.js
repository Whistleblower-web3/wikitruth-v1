/**
 * Initialization Configuration Module
 * responsible for setting initial parameters and address configuration for contracts
 */

const crypto = require('crypto');

// Set initial parameters and export
const incrementRate = 200;
const bidIncrementRate = 110;
const serviceFeeRate = 30;
const otherRewardRate = 10;
const slippageProtection = 10;

async function initializeContracts(contracts, connectors, signers) {
  const {
    addressManager,
    truthBox,
    exchange,
    fundManager,
    swapContract,
    userManager,
    settlementToken,
    wBTC,
  } = contracts;

  const {
    truthBoxConnectors,
    exchangeConnectors,
    fundManagerConnectors,
  } = connectors;

  // Get the needed signers from the passed signers
  const {
    dao, governance, dao_fund_manager, siweAuth, quoter, forwarder
  } = signers;

  const addressList = [
    dao.address,
    governance.address,
    dao_fund_manager.address,
    userManager.target, 
    siweAuth.address, // NOTE: local test, use address to replace siweAuth token contract address.
    truthBox.target, 
    exchange.target, 
    fundManager.target, 
    forwarder.address
  ];

  const swapContracts = [ 
    swapContract.target,
    quoter.address
  ];
  
  await addressManager.setAddressList(addressList);
  await addressManager.setSwapContracts(swapContracts);
  await addressManager.setAllAddress();
  // In tokenConfig.js, set the settlement token and add token
  // await addressManager.setSettlementToken(settlementToken.target);
  // await addressManager.addToken(wBTC.target);

  // Set initial parameters
  await truthBoxConnectors.dao.setIncrementRate(incrementRate);
  await exchangeConnectors.dao.setRefundRequestPeriod(15 * 24 * 60 * 60); // 15 days
  await exchangeConnectors.dao.setRefundReviewPeriod(30 * 24 * 60 * 60); // 30 days
  await exchangeConnectors.dao.setBidIncrementRate(bidIncrementRate);
  await fundManagerConnectors.dao.setServiceFeeRate(serviceFeeRate);
  await fundManagerConnectors.dao.setHelperRewardRate(otherRewardRate);
  // await fundManagerConnectors.dao.setSlippageProtection(slippageProtection);

  // Generate test data
  const testData = generateTestData();

  // Create test TruthBox projects
  await createTestTruthBoxes(truthBoxConnectors.minter, testData);

  return testData;
}

function generateTestData() {
  // Generate random byte data
  const randomBytes = crypto.randomBytes(32);
  
  return {
    bytes_mint: '0x' + randomBytes.toString('hex'),
    bytes_deliver: '0x' + randomBytes.toString('hex'),
    officeKey01: '0x' + crypto.randomBytes(32).toString('hex'),
    officeKey02: '0x' + crypto.randomBytes(32).toString('hex'),
    officeKey03: '0x' + crypto.randomBytes(32).toString('hex'),
    bytes32_1: '0x' + crypto.randomBytes(32).toString('hex'),
    bytes32_2: '0x' + crypto.randomBytes(32).toString('hex'),
    bytes32_buyer: '0x' + crypto.randomBytes(32).toString('hex'),
    address_zero: '0x0000000000000000000000000000000000000000',
    bytes32_zero: '0x'
  };
}

async function createTestTruthBoxes(truthBoxMinter, testData) {
  const signers = await ethers.getSigners();
  const minter = signers[4]; // minter is the 5th signer

  // Create test TruthBox projects
  await truthBoxMinter.create( "00_tokenURI", "00_infoURI", testData.bytes_mint, 1000);
  await truthBoxMinter.create("01_tokenURI", "01_infoURI", testData.bytes_mint, 1000);
  await truthBoxMinter.create("02_tokenURI", "02_infoURI", testData.bytes_mint, 1000);
  await truthBoxMinter.create( "03_tokenURI", "03_infoURI", testData.bytes_mint, 1000);
  await truthBoxMinter.create("04_tokenURI", "04_infoURI", testData.bytes_mint, 1000);
  await truthBoxMinter.createAndPublish("05_tokenURI——public", "05_infoURI——public");
}

module.exports = {
  initializeContracts,
  generateTestData,
  createTestTruthBoxes,
  incrementRate,
  bidIncrementRate,
  serviceFeeRate,
  otherRewardRate,
  slippageProtection
};
