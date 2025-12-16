import { ethers } from "hardhat";
import { Signer } from "ethers";

/**
 * EIP712 permit type enumeration
 */
export enum PermitType {
    View = 0,
    Transfer = 1,
    Approve = 2
}

/**
 * EIP712 signature result interface
 */
export interface EIP712SignatureResult {
    signature: string; // Complete signature string
    r: string;
    s: string;
    v: number;
    domain: {
        name: string;
        version: string;
        chainId: number;
        verifyingContract: string;
    };
    value: {
        label: number;
        owner: string;
        spender: string;
        amount: bigint;
        deadline: number;
    };
}

/**
 * Simple EIP712 signature function
 * 
 * @param signer Signer
 * @param spender Authorized recipient address
 * @param amount Authorization amount
 * @param permitType Permit type (0=View, 1=Transfer, 2=Approve)
 * @param contractAddress Contract address
 * @param domainName Domain name
 * @param domainVersion Domain version, default is "1"
 * @param deadline Deadline (Unix timestamp), default is 1 hour later
 * @returns EIP712 signature result
 */
export async function signEIP712(
    signer: Signer,
    spender: string,
    amount: bigint | number,
    permitType: PermitType,
    contractAddress: string,
    domainName?: string,
    domainVersion?: string,
    deadline?: number
): Promise<EIP712SignatureResult> {
    // Get signer address
    const owner = await signer.getAddress();
    
    // Get chain ID
    const network = await ethers.provider.getNetwork();
    const chainId = Number(network.chainId);

    const defaultDomainName = domainName || "Secret ERC20 Token";
    const defaultDomainVersion = domainVersion || "1";
    
    // Set deadline (default 1 hour later)
    const finalDeadline = deadline || Math.floor(Date.now() / 1000) + 3600;
    
    // Create EIP712 domain
    const domain = {
        name: defaultDomainName,
        version: defaultDomainVersion,
        chainId: chainId,
        verifyingContract: contractAddress
    };
    
    // EIP712 type definitions
    const types = {
        EIP712Permit: [
            { name: "label", type: "uint8" },
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "deadline", type: "uint256" }
        ]
    };
    
    // Signature value
    const value = {
        label: permitType,
        owner: owner,
        spender: spender,
        amount: BigInt(amount),
        deadline: finalDeadline
    };
    
    // Execute EIP712 signature
    const signature = await signer.signTypedData(domain, types, value);
    const sig = ethers.Signature.from(signature);
    
    return {
        signature: signature,
        r: sig.r,
        s: sig.s,
        v: sig.v,
        domain: domain,
        value: value
    };
}

/**
 * Build EIP712Permit
 */
export async function buildEIP712Permit (
    signer: Signer,
    spender: string,
    amount: bigint | number,
    permitType: PermitType,
    contractAddress: string,
    domainName?: string,
    domainVersion?: string,
    deadline?: number
): Promise<any | null> {

    try {
    const eip712Result = await signEIP712(
        signer,
        spender, // In transfer, spender is the recipient address
        amount,
        permitType,
        contractAddress,
        domainName,
        domainVersion,
        deadline
    );

    // Build EIP712Permit struct
    const permit = {
        label: eip712Result.value.label, // PermitLabel.TRANSFER = 1
        owner: eip712Result.value.owner,
        spender: eip712Result.value.spender,
        amount: eip712Result.value.amount,
        deadline: eip712Result.value.deadline,
        signature: {
            r: eip712Result.r,
            s: eip712Result.s,
            v: eip712Result.v
        }
    };
    return permit;
    } catch (error) {
        console.error("Failed to build EIP712Permit:", error);
        return null;
    }
}

/**
 * Verify EIP712 signature
 * 
 * @param domain EIP712 domain configuration
 * @param types Type definitions
 * @param value Signature value
 * @param signature Signature string
 * @param expectedAddress Expected signer address
 * @returns Whether verification passed
 */
export async function verifyEIP712(
    domain: any,
    types: Record<string, any[]>,
    value: Record<string, any>,
    signature: string,
    expectedAddress: string
): Promise<boolean> {
    try {
        const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
        return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
        console.error("Signature verification failed:", error);
        return false;
    }
}

