// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer, Contract, BigNumberish } from 'ethers';
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * Test environment configuration interface
 */
export interface TestConfig {
    chainId: number;
    networkName: string;
    isLocal: boolean;
    gasLimit?: number;
    gasPrice?: BigNumberish;
}

/**
 * Transaction configuration interface
 */
export interface TransactionConfig {
    gasLimit?: number;
    gasPrice?: BigNumberish;
    value?: BigNumberish;
    nonce?: number;
}

/**
 * Test result interface
 */
export interface TestResult {
    success: boolean;
    message: string;
    data?: any;
    error?: Error;
}

/**
 * Wait for specified time (milliseconds)
 * 
 * @param ms Wait time (milliseconds)
 */
export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Wait for specified number of blocks
 * 
 * @param blockCount Number of blocks to wait for
 */
export const waitForBlocks = async (blockCount: number): Promise<void> => {
    console.log(`⏳ Waiting for ${blockCount} blocks...`);
    
    const currentBlock = await ethers.provider.getBlockNumber();
    const targetBlock = currentBlock + blockCount;
    
    while (await ethers.provider.getBlockNumber() < targetBlock) {
        await sleep(1000); // Wait 1 second后再检查
    }
    
    console.log(`✅ Waited for ${blockCount} blocks`);
};

/**
 * Wait for transaction confirmation
 * 
 * @param txHash Transaction hash
 * @param confirmations Number of confirmations (default 1)
 * @returns Transaction receipt
 */
export const waitForTransaction = async (
    txHash: string, 
    confirmations: number = 1
): Promise<any> => {
    console.log(`⏳ Waiting for transaction confirmation: ${txHash}`);
    
    try {
        const receipt = await ethers.provider.waitForTransaction(txHash, confirmations);
        console.log(`✅ Transaction confirmed, block number: ${receipt?.blockNumber}`);
        return receipt;
    } catch (error) {
        console.error(`❌ Waiting for transaction confirmation failed:`, error);
        throw error;
    }
};

/**
 * Get account balance
 * 
 * @param address Account address
 * @returns Balance (ETH)
 */
export const getBalance = async (address: string): Promise<string> => {
    try {
        const balance = await ethers.provider.getBalance(address);
        return ethers.formatEther(balance);
    } catch (error) {
        console.error(`❌ Failed to get balance for account ${address}:`, error);
        throw error;
    }
};

/**
 * Send ETH
 * 
 * @param from Sender signer
 * @param to Receiver address
 * @param amount Amount (ETH)
 * @param config Transaction configuration
 * @returns Transaction hash
 */
export const sendETH = async (
    from: Signer,
    to: string,
    amount: string,
    config?: TransactionConfig
): Promise<string> => {
    console.log(`💰 Sending ${amount} ETH from ${await from.getAddress()} to ${to}`);
    
    try {
        const tx = await from.sendTransaction({
            to,
            value: ethers.parseEther(amount),
            gasLimit: config?.gasLimit,
            gasPrice: config?.gasPrice,
            nonce: config?.nonce
        });
        
        console.log(`✅ Transaction sent, hash: ${tx.hash}`);
        return tx.hash;
    } catch (error) {
        console.error("❌ Failed to send ETH:", error);
        throw error;
    }
};

/**
 * Deploy contract
 * 
 * @param contractFactory Contract factory instance
 * @param deployer Deployer signer
 * @param args Constructor parameters
 * @param config Transaction configuration
 * @returns Deployed contract instance
 */
export const deployContract = async <T extends Contract>(
    contractFactory: any,
    deployer: Signer,
    args: any[] = [],
    config?: TransactionConfig
): Promise<T> => {
    console.log(`🚀 Deploying contract...`);
    
    try {
        // Check parameters
        if (!contractFactory || !deployer) {
            throw new Error("Contract factory and deployer cannot be empty");
        }
        
        // Check if the contract factory has a deploy method
        if (typeof contractFactory.deploy !== 'function') {
            throw new Error("Provided is not a valid contract factory");
        }
        
        // Use deployer to connect contract factory
        const connectedFactory = contractFactory.connect(deployer);
        
        // Deploy contract
        const contract = await connectedFactory.deploy(...args, {
            gasLimit: config?.gasLimit,
            gasPrice: config?.gasPrice
        });
        
        await contract.waitForDeployment();
        const address = await contract.getAddress();
        
        console.log(`✅ Contract deployed successfully, address: ${address}`);
        return contract as T;
    } catch (error) {
        console.error("❌ Contract deployment failed:", error);
        throw error;
    }
};

/**
 * Call contract method and wait for confirmation
 * 
 * @param contract Contract instance
 * @param methodName Method name
 * @param args Method parameters
 * @param config Transaction configuration
 * @returns Transaction receipt
 */
export const callContractMethod = async (
    contract: Contract,
    methodName: string,
    args: any[] = [],
    config?: TransactionConfig
): Promise<any> => {
    console.log(`📞 Calling contract method: ${methodName}`);
    
    try {
        const tx = await contract[methodName](...args, {
            gasLimit: config?.gasLimit,
            gasPrice: config?.gasPrice,
            value: config?.value
        });
        
        const receipt = await tx.wait();
        console.log(`✅ Method called successfully, transaction hash: ${tx.hash}`);
        return receipt;
    } catch (error) {
        console.error(`❌ Failed to call method ${methodName}:`, error);
        throw error;
    }
};

/**
 * Read contract state
 * 
 * @param contract Contract instance
 * @param methodName Method name
 * @param args Method parameters
 * @returns Return value
 */
export const readContractState = async (
    contract: Contract,
    methodName: string,
    args: any[] = []
): Promise<any> => {
    try {
        const result = await contract[methodName](...args);
        console.log(`📖 Reading state ${methodName}:`, result.toString());
        return result;
    } catch (error) {
        console.error(`❌ Failed to read state ${methodName}:`, error);
        throw error;
    }
};

/**
 * Verify contract event
 * 
 * @param receipt Transaction receipt
 * @param eventName Event name
 * @param expectedArgs Expected event parameters
 * @returns Verification result
 */
export const verifyContractEvent = (
    receipt: any,
    eventName: string,
    contract: Contract,
    expectedArgs?: any[]
): TestResult => {
    try {
        const event = receipt.logs.find((log: any) => {
            try {
                const parsed = contract.interface.parseLog(log);
                return parsed?.name === eventName;
            } catch {
                return false;
            }
        });
        
        if (!event) {
            return {
                success: false,
                message: `Event not found: ${eventName}`
            };
        }
        
        if (expectedArgs) {
            const parsed = contract.interface.parseLog(event);
            for (let i = 0; i < expectedArgs.length; i++) {
                if (parsed?.args[i] !== expectedArgs[i]) {
                    return {
                        success: false,
                        message: `Event parameters do not match, index ${i}: expected ${expectedArgs[i]}, actual ${parsed?.args[i]}`
                    };
                }
            }
        }
        
        return {
            success: true,
            message: `Event ${eventName} verified successfully`,
            data: event
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to verify event: ${error}`,
            error: error as Error
        };
    }
};

/**
 * Generate random address
 */
export const generateRandomAddress = (): string => {
    return ethers.Wallet.createRandom().address;
};

/**
 * Generate random private key
 */
export const generateRandomPrivateKey = (): string => {
    return ethers.Wallet.createRandom().privateKey;
};

/**
 * Format big number
 * 
 * @param value Big number
 * @param decimals Decimal places
 * @returns Formatted string
 */
export const formatBigNumber = (value: BigNumberish, decimals: number = 18): string => {
    return ethers.formatUnits(value, decimals);
};

/**
 * Parse big number
 * 
 * @param value String value
 * @param decimals Decimal places
 * @returns Big number
 */
export const parseBigNumber = (value: string, decimals: number = 18): bigint => {
    return ethers.parseUnits(value, decimals);
};

/**
 * Check if address is zero address
 */
export const isZeroAddress = (address: string): boolean => {
    return address === ethers.ZeroAddress;
};

/**
 * Check if address is valid
 */
export const isValidAddress = (address: string): boolean => {
    return ethers.isAddress(address);
};

/**
 * Get current timestamp
 */
export const getCurrentTimestamp = (): number => {
    return Math.floor(Date.now() / 1000);
};

/**
 * Timestamp to date string
 */
export const timestampToDateString = (timestamp: number): string => {
    return new Date(timestamp * 1000).toISOString();
};

/**
 * Retry function
 * 
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param delay Retry interval (milliseconds)
 * @returns Function execution result
 */
export const retry = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> => {
    let lastError: Error;
    
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            
            if (i === maxRetries) {
                throw lastError;
            }
            
            console.log(`⚠️ The ${i + 1}th attempt failed, ${delay}ms later retry...`);
            await sleep(delay);
        }
    }
    
    throw lastError!;
};

/**
 * Test timeout wrapper function
 * 
 * @param fn Function to execute
 * @param timeout Timeout (milliseconds)
 * @returns Function execution result
 */
export const withTimeout = async <T>(
    fn: () => Promise<T>,
    timeout: number = 30000
): Promise<T> => {
    return Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Operation timed out (${timeout}ms)`)), timeout);
        })
    ]);
};

/**
 * Create test report
 */
export const createTestReport = (results: TestResult[]): string => {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = total - passed;
    
    let report = `\n📊 Test report\n`;
    report += `Total tests: ${total}\n`;
    report += `Passed: ${passed} ✅\n`;
    report += `Failed: ${failed} ❌\n`;
    report += `Success rate: ${((passed / total) * 100).toFixed(2)}%\n\n`;
    
    if (failed > 0) {
        report += `❌ Failed tests:\n`;
        results.filter(r => !r.success).forEach((result, index) => {
            report += `${index + 1}. ${result.message}\n`;
            if (result.error) {
                report += `   Error: ${result.error.message}\n`;
            }
        });
    }
    
    return report;
};
