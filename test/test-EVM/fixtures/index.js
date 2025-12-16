/**
 * Test fixture module index file
 * Unified export of all test-related modules
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
  // Contract deployment
  deployContracts,
  
  // Connector creation
  createConnectors,
  
  // Token configuration
  configureTokens,
  
  // Initialization configuration
  initializeContracts,
  generateTestData,
  createTestTruthBoxes,
  incrementRate,
  bidIncrementRate,
  serviceFeeRate,
  otherRewardRate,
  slippageProtection,
  
  // Utility functions
  utils: {
    generateTestData,
    createTestTruthBoxes
  }
};
