const {
  // time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const { deployContracts } = require("./fixtures/contracts");
const { createConnectors } = require("./fixtures/connectors");
const { configureTokens } = require("./fixtures/tokenConfig");
const { initializeContracts } = require("./fixtures/initialization");

/**
 * Main test fixture function
 * Integrates all modular configurations
 */
async function deployTruthBoxFixture() {
  // 1. Deploy all contracts
  const { signers, contracts } = await deployContracts();
  
  // 2. Create connectors
  const connectors = await createConnectors(signers, contracts);
  
  // 3. Configure tokens (minting, authorization, liquidity)
  await configureTokens(signers, contracts, connectors);
  
  // 4. Initialize contracts and create test data
  const testData = await initializeContracts(contracts, connectors, signers);
  
  // 5. Define time constants
  const DAY = 24 * 60 * 60;
  const MONTH = 30 * 24 * 60 * 60;
  const YEAR = 365 * 24 * 60 * 60;

  // 6. Return all test data and connectors
  return {
    // Signers
    ...signers,
    DAY, MONTH, YEAR,
    
    // Contracts
    ...contracts,
    
    // Connectors
    truthBox_minter: connectors.truthBoxConnectors.minter,
    truthBox_other: connectors.truthBoxConnectors.other,
    truthBox_DAO: connectors.truthBoxConnectors.dao,
    truthBox_buyer: connectors.truthBoxConnectors.buyer,
    
    exchange_minter: connectors.exchangeConnectors.minter,
    exchange_buyer: connectors.exchangeConnectors.buyer,
    exchange_buyer2: connectors.exchangeConnectors.buyer2,
    exchange_DAO: connectors.exchangeConnectors.dao,
    exchange_seller: connectors.exchangeConnectors.seller,
    exchange_other: connectors.exchangeConnectors.other,
    exchange_completer: connectors.exchangeConnectors.completer,
    
    fundManager_dao_fund_manager: connectors.fundManagerConnectors.dao_fund_manager,
    fundManager_completer: connectors.fundManagerConnectors.completer,
    fundManager_minter: connectors.fundManagerConnectors.minter,
    fundManager_buyer: connectors.fundManagerConnectors.buyer,
    fundManager_buyer2: connectors.fundManagerConnectors.buyer2,
    fundManager_DAO: connectors.fundManagerConnectors.dao,
    
    swapContract_minter: connectors.swapContractConnectors.minter,
    swapContract_buyer: connectors.swapContractConnectors.buyer,
    swapContract_other: connectors.swapContractConnectors.other,
    
    userManager_buyer: connectors.userManagerConnectors.buyer,
    userManager_minter: connectors.userManagerConnectors.minter,
    userManager_DAO: connectors.userManagerConnectors.dao,
    
    // Test data
    ...testData
  };
}

module.exports = {
  // deployFeeTokenFixture,
  deployTruthBoxFixture
};

