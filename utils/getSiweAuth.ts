// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer, Signature } from 'ethers';
import { SiweMessage } from 'siwe';
import '@nomicfoundation/hardhat-chai-matchers';


interface SiweConfig {
    chainId: number;
    version: string;
    defaultStatement: string;
    defaultExpirationHours: number;
}


export interface SiweMessageParams {
    domain: string;
    signer: Signer;
    expiration?: Date;
    chainId?: number;
    statement?: string;
    resources?: string[];
    uri?: string;
    nonce?: string;
    issuedAt?: Date;
    notBefore?: Date;
}

// TODO: Add: multiple domain configurations
const primaryDomain: string = "primary.example.com";
const domain1: string = "app.example.com";
const domain2: string = "api.example.com";
const domain3: string = "test.example.com";
const domain4: string = "dev.example.com";
// Invalid domain, for testing invalid domain login
const invalidDomain: string = "invalid.notallowed.com";

const domainTest: string = "domainsfs.example.com";
const domainTest2: string = "newOther.example.com";

export const domainList: string[] = [primaryDomain, domain1, domain2, domain3, domain4, invalidDomain, domainTest, domainTest2];

/**
 * Supported test network configurations
 */
const SUPPORTED_NETWORKS: Record<number, SiweConfig> = {
    23293: { // sapphire_localnet
        chainId: 23293,
        version: '1',
        defaultStatement: 'I accept the WikiTruth Terms of Service',
        defaultExpirationHours: 24
    },
    23294: { // sapphire_testnet
        chainId: 23295,
        version: '1',
        defaultStatement: 'I accept the WikiTruth Terms of Service',
        defaultExpirationHours: 24
    },
    23295: { // sapphire_mainnet
        chainId: 23294,
        version: '1',
        defaultStatement: 'I accept the WikiTruth Terms of Service',
        defaultExpirationHours: 24
    },
    31337: { // hardhat_local
        chainId: 31337,
        version: '1',
        defaultStatement: 'I accept the WikiTruth Terms of Service',
        defaultExpirationHours: 24
    }
};

/**
 * Get network configuration
 */
const getNetworkConfig = (chainId: number): SiweConfig => {
    const config = SUPPORTED_NETWORKS[chainId];
    if (!config) {
        throw new Error(`Unsupported chain ID: ${chainId}. Supported chain IDs: ${Object.keys(SUPPORTED_NETWORKS).join(', ')}`);
    }
    return config;
};

/**
 * Validate domain format
 */
const validateDomain = (domain: string): void => {
    if (!domain || typeof domain !== 'string') {
        throw new Error('Domain cannot be empty and must be a string');
    }
    
    // Simple domain format validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(domain)) {
        throw new Error('Domain format is invalid');
    }
};

/**
 * Validate signer
 */
const validateSigner = async (signer: Signer): Promise<string> => {
    if (!signer || typeof signer.getAddress !== 'function') {
        throw new Error('Signer is invalid');
    }
    
    try {
        return await signer.getAddress();
    } catch (error) {
        throw new Error(`Failed to get signer address: ${error}`);
    }
};

/**
 * Generate SIWE message
 * Simulate generating a SIWE (Sign-In with Ethereum) message
 * 
 * @param params SIWE message parameters
 * @returns SIWE message string
 */
export const siweMsg = async function (params: SiweMessageParams): Promise<string> {
    const {
        domain,
        signer,
        expiration,
        chainId,
        statement,
        resources,
        uri,
        nonce,
        issuedAt,
        notBefore
    } = params;

    console.log("🔐 Generating SIWE message...");

    try {
        // Parameter validation
        validateDomain(domain);
        const signerAddress = await validateSigner(signer);
        
        // Get network configuration
        const networkConfig = getNetworkConfig(chainId || 23293);
        
        // Set default expiration time
        const defaultExpiration = new Date();
        defaultExpiration.setHours(defaultExpiration.getHours() + networkConfig.defaultExpirationHours);
        
        // Build SIWE message
        const siweMessage = new SiweMessage({
            domain,
            address: signerAddress,
            statement: statement || networkConfig.defaultStatement,
            uri: uri || `https://${domain}`,
            version: networkConfig.version,
            chainId: chainId || networkConfig.chainId,
            expirationTime: expiration ? expiration.toISOString() : defaultExpiration.toISOString(),
            resources: resources || [],
            nonce: nonce || ethers.hexlify(ethers.randomBytes(16)),
            issuedAt: issuedAt ? issuedAt.toISOString() : new Date().toISOString(),
            notBefore: notBefore ? notBefore.toISOString() : undefined,
        });

        const message = siweMessage.toMessage();
        console.log(`✅ SIWE message generated successfully, signer: ${signerAddress}`);
        return message;

    } catch (error) {
        console.error("❌ Failed to generate SIWE message:", error);
        throw error;
    }
};

/**
 * Generate SIWE message (simplified version, for backward compatibility)
 */
export const siweMsgSimple = async function (
    domain: string,
    signer: Signer,
    expiration?: Date,
    chainId?: number,
    statement?: string,
    resources?: string[]
): Promise<string> {
    return siweMsg({
        domain,
        signer,
        expiration,
        chainId,
        statement,
        resources
    });
};

/**
 * Sign the message with ERC-191 "personal_sign"
 * 
 * @param msg Message to sign
 * @param account Signer account
 * @returns Signature object
 */
export const erc191sign = async function (msg: string, account: Signer): Promise<Signature> {
    console.log("✍️ Signing with ERC-191...");

    try {
        // Parameter validation
        if (!msg || typeof msg !== 'string') {
            throw new Error('Message cannot be empty and must be a string');
        }
        
        await validateSigner(account);
        
        // Execute signature
        const signature = await account.signMessage(msg);
        const sig = ethers.Signature.from(signature);
        
        console.log(`✅ ERC-191 signature successful, signer: ${await account.getAddress()}`);
        return sig;

    } catch (error) {
        console.error("❌ Failed to sign with ERC-191:", error);
        throw error;
    }
};

/**
 * Verify SIWE message signature
 * 
 * @param message SIWE message
 * @param signature Signature
 * @param expectedAddress Expected signer address
 * @returns Verification result
 */
export const verifySiweSignature = async function (
    message: string,
    signature: string,
    expectedAddress: string
): Promise<boolean> {
    try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
        console.error("❌ Failed to verify SIWE signature:", error);
        return false;
    }
};

/**
    * Generate random nonce
 */
export const generateNonce = (): string => {
    return ethers.hexlify(ethers.randomBytes(16));
};

/**
 * Get supported chain ID list
 */
export const getSupportedChainIds = (): number[] => {
    return Object.keys(SUPPORTED_NETWORKS).map(id => parseInt(id));
};

/**
 * Check if chain ID is supported
 */
export const isChainIdSupported = (chainId: number): boolean => {
    return chainId in SUPPORTED_NETWORKS;
};

