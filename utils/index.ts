// SPDX-License-Identifier: Apache-2.0

// Contract connection tool
export {
    connectContracts,
    connectContract
} from './connectContracts';

// Account management tool
export {
    getAccount,
    getAccountByRole,
    getSupportedChainIds,
    isChainIdSupported,
    type TestAccounts
} from './getAccount';

// SIWE authentication tool
export {
    siweMsg,
    siweMsgSimple,
    erc191sign,
    verifySiweSignature,
    generateNonce,
    getSupportedChainIds as getSiweSupportedChainIds,
    isChainIdSupported as isSiweChainIdSupported,
    domainList,
    type SiweMessageParams
} from './getSiweAuth';

// EIP712 signature tool
export {
    createEIP712Permit_PrivateToken,
    createEIP712Permit_PrivateTokenSimple,
    verifyEIP712Signature,
    createCustomEIP712Domain,
    getSupportedChainIds as getEIP712SupportedChainIds,
    isChainIdSupported as isEIP712ChainIdSupported,
    PermitType,
    type EIP712Domain,
    type EIP712PermitParams,
    type EIP712PermitResult
} from './getEIP712';

// General test tool
export {
    sleep,
    waitForBlocks,
    waitForTransaction,
    // getCurrentNetwork,
    getBalance,
    sendETH,
    deployContract,
    callContractMethod,
    readContractState,
    verifyContractEvent,
    generateRandomAddress,
    generateRandomPrivateKey,
    formatBigNumber,
    parseBigNumber,
    isZeroAddress,
    isValidAddress,
    getCurrentTimestamp,
    timestampToDateString,
    retry,
    withTimeout,
    createTestReport,
    type TestConfig,
    type TransactionConfig,
    type TestResult
} from './common';


