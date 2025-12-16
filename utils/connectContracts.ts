// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer, Contract } from 'ethers';
import { SiweMessage } from 'siwe';
import '@nomicfoundation/hardhat-chai-matchers';
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NETWORKS } from '@oasisprotocol/sapphire-paratime';

/**
 *  Connect addresses to contract instances
 *  Create independent contract connections for each address to avoid modifying the original contract instance
 */

export const connectContracts = async function <T extends Contract>(
    contractFactory: () => T,
    addresses: Signer[]
): Promise<T[]> {
    console.log("🚀 Connecting addresses to contract instances...");

    // 参数验证
    if (!contractFactory || typeof contractFactory !== 'function') {
        throw new Error("contractFactory must be a function that returns a contract instance");
    }
    
    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
        throw new Error("addresses must be a non-empty array of addresses");
    }

    const connectedContracts: T[] = [];

    try {
        for (let i = 0; i < addresses.length; i++) {
            const signer = addresses[i];
            
            // Validate signer
            if (!signer || typeof signer.getAddress !== 'function') {
                throw new Error(`Address index ${i} is not a valid signer`);
            }

            // Create a new contract instance for each address
            const contract = contractFactory();
            const connectedContract = contract.connect(signer) as T;
            connectedContracts.push(connectedContract);
            
            console.log(`✅ Address ${i + 1}/${addresses.length} connected: ${await signer.getAddress()}`);
        }

        console.log(`🎉 Successfully connected ${connectedContracts.length} contract instances`);
        return connectedContracts;

    } catch (error) {
        console.error("❌ Error connecting contracts:", error);
        throw error;
    }
}

/**
 * Connect a single contract to a specified address
 */
export const connectContract = async function <T extends Contract>(
    contract: T,
    signer: Signer
): Promise<T> {
    if (!contract) {
        throw new Error("Contract instance cannot be empty");
    }
    
    if (!signer || typeof signer.getAddress !== 'function') {
        throw new Error("Signer is invalid");
    }

    try {
        const connectedContract = contract.connect(signer) as T;
        console.log(`✅ Contract connected to address: ${await signer.getAddress()}`);
        return connectedContract;
    } catch (error) {
        console.error("❌ Error connecting contract:", error);
        throw error;
    }
}
    
