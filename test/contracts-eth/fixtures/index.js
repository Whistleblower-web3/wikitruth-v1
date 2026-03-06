/**
 * Test fixture index file
 * export all test related modules
 */

const { deployContracts } = require("./contracts");
const { createConnectors } = require("./connectors");
const { configureTokens } = require("./tokenConfig");
const { 
  initializeContracts, 
  generateTestData, 
  createTestTruthBoxes,
  incrementRate,
  bidIncrementRate,
  serviceFeeRate,
  otherRewardRate,
  slippageProtection
} = require("./initialization");

module.exports = {
  // Contract Deployment
  deployContracts,
  
  // Connector Creation
  createConnectors,
  
  // Token Configuration
  configureTokens,
  
  // Initialization Configuration
  initializeContracts,
  generateTestData,
  createTestTruthBoxes,
  incrementRate,
  bidIncrementRate,
  serviceFeeRate,
  otherRewardRate,
  slippageProtection,
  
  // Utils
  utils: {
    generateTestData,
    createTestTruthBoxes
  }
};
