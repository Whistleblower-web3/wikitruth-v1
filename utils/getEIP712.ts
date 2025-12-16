import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Signer, Signature } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * EIP712 permit type enumeration
 */
export enum PermitType {
    View = 0,
    Transfer = 1,
    Approve = 2
}

/**
 * EIP712 domain configuration interface
 */
export interface EIP712Domain {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
}

/**
 * EIP712 permit parameters interface
 */
export interface EIP712PermitParams {
    signer: Signer;
    spender: Signer | string;
    amount: bigint | number;
    mode: PermitType;
    contractAddress: string;
    domainName: string;
    network?: any;
    customDeadline?: number;
    domainVersion?: string;
}

/**
 * EIP712 permit result interface
 */
export interface EIP712PermitResult {
    label: PermitType;
    owner: string;
    spender: string;
    amount: bigint;
    deadline: number;
    signature: {
        r: string;
        s: string;
        v: number;
    };
    domain: EIP712Domain;
}

/**
 * Network configuration interface
 */
interface NetworkConfig {
    chainId: number;
    name: string;
    defaultDomainName: string;
    defaultDomainVersion: string;
}

/**
 * Supported test network configurations
 */
const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
    23293: { // sapphire_localnet
        chainId: 23293,
        name: "sapphire_localnet",
        defaultDomainName: "Private Token",
        defaultDomainVersion: "1"
    },
    23294: { // sapphire_testnet
        chainId: 23295,
        name: "sapphire_testnet",
        defaultDomainName: "Private Token",
        defaultDomainVersion: "1"
    },
    23295: { // sapphire_mainnet
        chainId: 23294,
        name: "sapphire_mainnet",
        defaultDomainName: "Private Token",
        defaultDomainVersion: "1"
    },
    31337: { // hardhat_local
        chainId: 31337,
        name: "hardhat_local",
        defaultDomainName: "Private Token",
        defaultDomainVersion: "1"
    }
};

/**
 * Get network configuration
 */
const getNetworkConfig = (chainId: number): NetworkConfig => {
    const config = SUPPORTED_NETWORKS[chainId];
    if (!config) {
        throw new Error(`Unsupported chain ID: ${chainId}. Supported chain IDs: ${Object.keys(SUPPORTED_NETWORKS).join(', ')}`);
    }
    return config;
};

/**
 * Validate address format
 */
const validateAddress = (address: string, name: string): void => {
    if (!address || typeof address !== 'string') {
        throw new Error(`${name} address cannot be empty and must be a string`);
    }
    
    if (!ethers.isAddress(address)) {
        throw new Error(`${name} address format is invalid: ${address}`);
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
 * Get address string
 */
const getAddressString = async (addressOrSigner: Signer | string): Promise<string> => {
    if (typeof addressOrSigner === 'string') {
        validateAddress(addressOrSigner, 'Address');
        return addressOrSigner;
    } else {
        return await validateSigner(addressOrSigner);
    }
};

/**
 * Create EIP712 domain configuration
 */
const createEIP712Domain = (
    contractAddress: string,
    chainId: number,
    domainName: string,
    domainVersion?: string
): EIP712Domain => {
    const networkConfig = getNetworkConfig(chainId);
    
    return {
        name: domainName || networkConfig.defaultDomainName,
        version: domainVersion || networkConfig.defaultDomainVersion,
        chainId: chainId,
        verifyingContract: contractAddress
    };
};

/**
 * Generate EIP712 permit signature
 * Create EIP712 permit signature for private token
 * 
 * @param params EIP712 permit parameters
 * @returns EIP712 permit result
 */
export const createEIP712Permit_PrivateToken = async function (
    params: EIP712PermitParams
): Promise<EIP712PermitResult> {
    const {
        signer,
        spender,
        amount,
        mode,
        contractAddress,
        network: networkParam,
        customDeadline,
        domainName,
        domainVersion
    } = params;

    console.log("🔐 Generating EIP712 permit signature...");

    try {
        // Parameter validation
        const signerAddress = await validateSigner(signer);
        const spenderAddress = await getAddressString(spender);
        
        validateAddress(contractAddress, 'Contract');
        
        // Validate amount
        if (amount < 0) {
            throw new Error('Amount cannot be negative');
        }
        
        // Validate permit type
        if (!Object.values(PermitType).includes(mode)) {
            throw new Error(`Invalid permit type: ${mode}`);
        }

        // Get chain ID
        const chainId = networkParam?.chainId || (await ethers.provider.getNetwork()).chainId;
        
        // Create domain configuration
        const domain = createEIP712Domain(contractAddress, Number(chainId), domainName, domainVersion);
        
        // Set deadline
        const deadline = customDeadline || Math.floor(Date.now() / 1000) + 3600; // Default 1 hour later
        
        // EIP712 type definition
        const types = {
            EIP712Permit: [
                { name: "label", type: "uint8" }, // PermitType enumeration corresponds to uint8
                { name: "owner", type: "address" },
                { name: "spender", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "deadline", type: "uint256" }
            ]
        };
        
        // Signature value
        const value = {
            label: mode,
            owner: signerAddress,
            spender: spenderAddress,
            amount: BigInt(amount),
            deadline: deadline
        };
        
        console.log(`📝 Signature parameters:`, {
            owner: signerAddress,
            spender: spenderAddress,
            amount: amount.toString(),
            mode: PermitType[mode],
            deadline: new Date(deadline * 1000).toISOString()
        });
        
        // Execute EIP712 signature
        const signature = await signer.signTypedData(domain, types, value);
        const sig = ethers.Signature.from(signature);
        
        const result: EIP712PermitResult = {
            label: mode,
            owner: signerAddress,
            spender: spenderAddress,
            amount: BigInt(amount),
            deadline: deadline,
            signature: {
                r: sig.r,
                s: sig.s,
                v: sig.v
            },
            domain: domain
        };
        
        console.log(`✅ EIP712 permit signature generated successfully`);
        return result;

    } catch (error) {
        console.error("❌ Failed to generate EIP712 permit signature:", error);
        throw error;
    }
};

/**
 * Generate EIP712 permit signature (simplified version, for backward compatibility)
 */
export const createEIP712Permit_PrivateTokenSimple = async function (
    signer: Signer,
    spender: Signer | string,
    amount: number,
    mode: PermitType,
    contractAddress: string,
    domainName: string,
    network?: any,
    customDeadline?: number
): Promise<EIP712PermitResult> {
    return createEIP712Permit_PrivateToken({
        signer,
        spender,
        amount,
        mode,
        contractAddress,
        domainName,
        network,
        customDeadline
    });
};

/**
 * Verify EIP712 signature
 * 
 * @param domain EIP712 domain configuration
 * @param types Type definition
 * @param value Signature value
 * @param signature Signature
 * @param expectedAddress Expected signer address
 * @returns Verification result
 */
export const verifyEIP712Signature = async function (
    domain: EIP712Domain,
    types: Record<string, any[]>,
    value: Record<string, any>,
    signature: string,
    expectedAddress: string
): Promise<boolean> {
    try {
        const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
        return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
        console.error("❌ Failed to verify EIP712 signature:", error);
        return false;
    }
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

/**
 * Create custom EIP712 domain
 */
export const createCustomEIP712Domain = (
    name: string,
    version: string,
    chainId: number,
    verifyingContract: string
): EIP712Domain => {
    validateAddress(verifyingContract, '合约');
    
    return {
        name,
        version,
        chainId,
        verifyingContract
    };
};


