import { user_oasis_WikiTruth } from "../../WikiTruth_account";
import { ethers } from "ethers";
import * as crypto from "crypto";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Run: npx hardhat run scripts/utils/convertOasisToEvmPrivateKey.ts

/**
 * Convert Oasis private key to EVM private key
 * Oasis uses Ed25519 signature algorithm, EVM uses secp256k1 signature algorithm
 * Here we generate EVM-compatible private key through hash conversion
 */
function convertOasisToEvmPrivateKey(oasisPrivateKey: string): string {
    try {
        // Oasis private key is Base64 encoded, decode first
        const decodedKey = Buffer.from(oasisPrivateKey, 'base64');
        
        // Use SHA256 hash of decoded private key to generate 32-byte EVM private key
        const hash = crypto.createHash('sha256').update(decodedKey).digest();
        
        // Convert to hexadecimal string and add 0x prefix
        return '0x' + hash.toString('hex');
    } catch (error) {
        throw new Error(`Private key conversion failed: ${error}`);
    }
}

/**
 * Verify EVM private key and get address
 */
function getEvmAddressFromPrivateKey(privateKey: string): string {
    try {
        const wallet = new ethers.Wallet(privateKey);
        return wallet.address;
    } catch (error) {
        throw new Error(`Invalid private key: ${error}`);
    }
}

/**
 * Main function: convert and display results
 */
async function main() {
    console.log("=== Oasis Private Key to EVM Private Key Conversion Tool ===\n");
    
    // Get all Oasis accounts
    const oasisAccounts = user_oasis_WikiTruth;
    
    console.log("Conversion results:\n");
    console.log("Account Type".padEnd(12) + "Oasis Address".padEnd(50) + "EVM Address".padEnd(45) + "EVM Private Key");
    console.log("-".repeat(120));
    
    for (const [accountType, account] of Object.entries(oasisAccounts)) {
        if (account.privateKey && account.address) {
            try {
                // Convert private key
                const evmPrivateKey = convertOasisToEvmPrivateKey(account.privateKey);
                
                // Get EVM address
                const evmAddress = getEvmAddressFromPrivateKey(evmPrivateKey);
                
                console.log(
                    accountType.padEnd(12) + 
                    account.address.padEnd(50) + 
                    evmAddress.padEnd(45) + 
                    evmPrivateKey
                );
            } catch (error) {
                console.log(
                    accountType.padEnd(12) + 
                    account.address.padEnd(50) + 
                    "Conversion failed".padEnd(45) + 
                    error
                );
            }
        } else {
            console.log(
                accountType.padEnd(12) + 
                "Not configured".padEnd(50) + 
                "Not configured".padEnd(45) + 
                "Not configured"
            );
        }
    }
    
    console.log("\n=== Conversion completed ===");
    console.log("Note:");
    console.log("1. This is an EVM private key generated through hash conversion, different from the original Oasis private key");
    console.log("2. Please keep the generated EVM private key safe");
    console.log("3. It is recommended to verify the conversion results on a test network first");
}

// Run script
if (require.main === module) {
    main().catch((error) => {
        console.error("Script execution failed:", error);
        process.exit(1);
    });
}

export { convertOasisToEvmPrivateKey, getEvmAddressFromPrivateKey };