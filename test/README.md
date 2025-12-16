# WikiTruth Test Suite

WikiTruth project contains two versions of contracts and corresponding test suites:

## 📁 Project Structure

```
test/
├── test-EVM/                   # EVM version tests (JavaScript)
│   ├── *.js                   # Test files
│   └── fixtures/              # Test fixtures
│
├── utils/                     # Utility functions (TypeScript)
│   ├── common.ts             # Common utilities
│   ├── getAccount.ts         # Account management
│   ├── getSiweAuth.ts        # SIWE authentication
│   ├── connectContracts.ts  # Contract connection
│   └── index.ts             # Export index
│
├── single/                    # Standalone tests
│   ├── SiweAuth.ts           # SiweAuth contract tests
│   └── ERC20Secret.ts        # ERC20Secret tests
│
└── README.md                  # This document
```

## 🔑 Differences Between Two Versions

### EVM Version (test-EVM/)
- **Language**: JavaScript
- **Network**: Ethereum EVM compatible networks
- **Authentication**: Does not use SiweAuth (uses address instead)
- **Encryption**: Does not use Sapphire encryption library
- **Status**: ✅ Completed and passed all tests

### Sapphire Version (test/sapphire/)
- **Language**: TypeScript
- **Network**: Oasis Sapphire privacy network
- **Authentication**: ✅ Uses SiweAuth token authentication
- **Encryption**: ✅ Uses Sapphire encryption library (implicit)
- **Status**: ✅ Newly created, professionally designed

## 🚀 Quick Start

### Run EVM Version Tests

```bash
# Run all EVM tests
npx hardhat test test/test-EVM/*.js

# Run specific tests
npx hardhat test test/test-EVM/TruthBox.js
npx hardhat test test/test-EVM/Exchange.js
```

## 📊 Test Coverage Comparison

| Feature Module | EVM Version | Sapphire Version |
|---------|---------|--------------|
| TruthBox Basic Functions | ✅ | ✅ |
| Exchange Trading Functions | ✅ | ✅ |
| FundManager Fund Management | ✅ | ✅ |
| TruthNFT NFT Functions | ✅ | ✅ |
| UserId User Management | ✅ | ✅ |
| SiweAuth Authentication | ❌ | ✅ |
| Sapphire Encryption | ❌ | ✅ (implicit) |
| Integration Tests | ✅ | ✅ |

## 🔧 Key Features of Sapphire Version

### 1. SiweAuth Integration

The core difference of Sapphire version is the use of SiweAuth for token authentication:

```typescript
// Generate tokens during fixture initialization
const { siweTokens } = await generateSiweAuthTokens(accounts, contracts, connectors, chainId);

// tokens contain authentication tokens for all test users
// {
//   admin: "0x...",
//   minter: "0x...",
//   buyer: "0x...",
//   ...
// }
```


### 3. TypeScript Type Safety

All interfaces and types are clearly defined:

```typescript
export interface TestAccounts {
    admin: Wallet;
    minter: Wallet;
    buyer: Wallet;
    buyer2: Wallet;
    seller: Wallet;
    completer: Wallet;
}

export interface DeployedContracts {
    addressManager: Contract;
    officialToken: Contract;
    siweAuth: Contract;
    // ...
}
```

## 📝 Writing New Tests

### EVM Version

```javascript
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { deployTruthBoxFixture } = require("./Fixture.js");

describe("My Test", function () {
    it("should...", async function () {
        const { admin, truthBox, exchange } = await loadFixture(deployTruthBoxFixture);
        // Test logic
    });
});
```

## 🌐 Supported Networks

### EVM Version
- Hardhat local network (default)
- Any EVM compatible network

### Sapphire Version
- `sapphire_localnet` (chainId: 23293) - Local testnet
- `sapphire_testnet` (chainId: 23294) - Sapphire testnet
- `sapphire_mainnet` (chainId: 23295) - Sapphire mainnet

## 🛠️ Utility Functions

The project provides rich utility functions (located in `test/utils/`):

### Account Management
```typescript
import { getAccount } from './utils/getAccount';

const accounts = await getAccount(chainId);
// { admin, minter, buyer, buyer2, seller, completer }
```

### SIWE Authentication
```typescript
import { siweMsg, erc191sign } from './utils/getSiweAuth';

const message = await siweMsg({ domain, signer, chainId });
const signature = await erc191sign(message, signer);
```

### Contract Connection
```typescript
import { connectContract } from './utils/connectContracts';

const connectedContract = await connectContract(contract, signer);
```

### Common Utilities
```typescript
import { sleep, waitForBlocks, getBalance } from './utils/common';

await sleep(1000); // Wait 1 second
await waitForBlocks(10); // Wait 10 blocks
const balance = await getBalance(address); // Get balance
```

## 🐛 Troubleshooting

### Issue: Test Timeout

**Solution**:
```typescript
describe("My Test", function () {
    this.timeout(60000); // Increase timeout to 60 seconds
    
    it("should...", async function () {
        // Test code
    });
});
```

### Issue: SiweAuth Token Expired

**Solution**: Token default validity period is 24 hours, if tests run for a long time, you may need to regenerate tokens.

## 📚 References

- [Hardhat Documentation](https://hardhat.org/docs)
- [Oasis Sapphire Documentation](https://docs.oasis.io/dapp/sapphire/)
- [SIWE Specification](https://eips.ethereum.org/EIPS/eip-4361)
- [Chai Assertion Library](https://www.chaijs.com/)
- [Mocha Test Framework](https://mochajs.org/)

## 🤝 Contribution Guidelines

1. Follow existing code style
2. Add tests for new features
3. Ensure all tests pass
4. Update relevant documentation

## 📄 License

Apache-2.0

