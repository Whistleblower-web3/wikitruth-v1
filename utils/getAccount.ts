import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Signer, Wallet } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { user_evm_WikiTruth } from "../WikiTruth_account";

/**
 * Network configuration interface
 */
interface NetworkConfig {
    chainId: number;
    name: string;
    isLocal: boolean;
}

/**
 * Test account interface
 */
export interface TestAccounts {
    admin: Wallet;
    minter: Wallet;
    buyer: Wallet;
    buyer2: Wallet;
    seller: Wallet;
    completer: Wallet;
}

/**
 * Supported test network configurations
 */
const SUPPORTED_NETWORKS: NetworkConfig[] = [
    { chainId: 23293, name: "sapphire_localnet", isLocal: true },
    { chainId: 23294, name: "sapphire_testnet", isLocal: false },
    { chainId: 23295, name: "sapphire_mainnet", isLocal: false },
    { chainId: 31337, name: "hardhat_local", isLocal: true },
    { chainId: 1337, name: "ganache_local", isLocal: true }
];

/**
 * Get network configuration
 */
const getNetworkConfig = (chainId: number): NetworkConfig => {
    const config = SUPPORTED_NETWORKS.find(net => net.chainId === chainId);
    if (!config) {
        throw new Error(`Unsupported chain ID: ${chainId}. Supported chain IDs: ${SUPPORTED_NETWORKS.map(n => n.chainId).join(', ')}`);
    }
    return config;
};

/**
 * Validate private key format
 */
const validatePrivateKey = (privateKey: string, accountName: string): void => {
    if (!privateKey) {
        throw new Error(`${accountName} private key is not configured`);
    }
    
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
        throw new Error(`${accountName} private key format is invalid, should be 66-character hexadecimal string (including 0x prefix)`);
    }
};

/**
 * Create wallet instance from configuration
 */
const createWalletFromConfig = (accountConfig: any, accountName: string): Wallet => {
    validatePrivateKey(accountConfig.privateKey, accountName);
    
    try {
        return new ethers.Wallet(accountConfig.privateKey, ethers.provider);
    } catch (error) {
        throw new Error(`Failed to create ${accountName} wallet: ${error}`);
    }
};

/**
 * Get test accounts
 * Based on the test network ID, get the corresponding test accounts
 * 
 * @param chainId Chain ID
 * @returns Test accounts object
 */
export const getAccount = async function (chainId: number| bigint): Promise<TestAccounts> {
    console.log(`🔍 Getting test accounts for chain ID ${chainId}...`);
    
    if (typeof chainId === 'bigint') {
        chainId = Number(chainId);
    }

    try {
        const networkConfig = getNetworkConfig(chainId);
        console.log(`📡 Network: ${networkConfig.name} (${networkConfig.isLocal ? 'Local' : 'Remote'})`);

        let accounts: TestAccounts;

        if (networkConfig.isLocal) {
            // Local network: get accounts from hardhat
            console.log("🏠 Using local network accounts...");
            const signers = await ethers.getSigners();
            
            if (signers.length < 6) {
                throw new Error(`Local network accounts are insufficient, at least 6 accounts are required, actually only ${signers.length} accounts`);
            }

            accounts = {
                admin: signers[0] as unknown as Wallet,
                minter: signers[1] as unknown as Wallet,
                buyer: signers[2] as unknown as Wallet,
                buyer2: signers[3] as unknown as Wallet,
                seller: signers[4] as unknown as Wallet,
                completer: signers[5] as unknown as Wallet
            };

        } else {
            // Remote network: get accounts from configuration file
            console.log("🌐 Using remote network accounts...");
            
            // 验证配置文件
            if (!user_evm_WikiTruth) {
                throw new Error("Remote network accounts configuration not found");
            }

            accounts = {
                admin: createWalletFromConfig(user_evm_WikiTruth.admin, "admin"),
                minter: createWalletFromConfig(user_evm_WikiTruth.minter, "minter"),
                buyer: createWalletFromConfig(user_evm_WikiTruth.buyer, "buyer"),
                buyer2: createWalletFromConfig(user_evm_WikiTruth.buyer2, "buyer2"),
                seller: createWalletFromConfig(user_evm_WikiTruth.seller, "seller"),
                completer: createWalletFromConfig(user_evm_WikiTruth.completer, "completer")
            };
        }

        // Validate all account addresses
        console.log("✅ Validating all account addresses...");
        for (const [role, wallet] of Object.entries(accounts)) {
            const address = await wallet.getAddress();
            console.log(`  ${role}: ${address}`);
        }

        console.log("🎉 Successfully got all test accounts");
        return accounts;

    } catch (error) {
        console.error("❌ Failed to get test accounts:", error);
        throw error;
    }
};

/**
 * Get a single test account
 * 
 * @param chainId Chain ID
 * @param role Account role
 * @returns Wallet instance of the specified role
 */
export const getAccountByRole = async function (
    chainId: number, 
    role: keyof TestAccounts
): Promise<Wallet> {
    const accounts = await getAccount(chainId);
    return accounts[role];
};

/**
 * Get all supported chain IDs
 */
export const getSupportedChainIds = (): number[] => {
    return SUPPORTED_NETWORKS.map(net => net.chainId);
};

/**
 * Check if chain ID is supported
 */
export const isChainIdSupported = (chainId: number): boolean => {
    return SUPPORTED_NETWORKS.some(net => net.chainId === chainId);
};
