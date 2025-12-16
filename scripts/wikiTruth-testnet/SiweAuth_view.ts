import { ethers } from "hardhat";
import {
    user_evm_WikiTruth
} from "../../WikiTruth_account";
import { wikiTruth_contracts_address } from "../utils/wikiTruth_contracts_address";
import { getSiweMsg, erc191sign } from "../utils/SiweAuth";
import { boxList } from "../../private/boxList";

/**
 * 
 * @returns Use SIWE to verify identity and read TruthBox contract data
 * 
 * Implementation flow:
 * 1. Create a SIWE message
 * 2. Sign the SIWE message using signer
 * 3. Call SiweAuth contract's login function to get authentication token
 * 4. Use token to call TruthBox contract's getPrivateData function to read private data
 * 
 * Run command: npx hardhat run scripts/wikiTruth-testnet/SiweAuth_view.ts --network sapphire-testnet
 */

const primaryDomain = "wikitruth.eth.limo";
const chainId = 23295; // sapphire-testnet

async function main() {
    console.log("🚀 Starting to read TruthBox contract data using SIWE authentication...");

    // Check chainId 
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Current network ID:", network.chainId);
    if (Number(network.chainId) !== chainId) {
        console.error("❌ Current network ID is not 23295, please check network ID");
        return;
    }

    // Get signer account
    const privateKey = user_evm_WikiTruth.minter.privateKey;
    if (!privateKey) {
        console.error("❌ privateKey does not exist, please check configuration");
        return;
    }
    const signer = new ethers.Wallet(privateKey, ethers.provider);
    const signerAddress = await signer.getAddress();
    console.log("👤 Signer address:", signerAddress);

    // =========================== Step 1: Get SiweAuth contract ==================================
    console.log("\n📝 Step 1: Getting SiweAuthWikiTruth contract...");
    const siweAuth = await ethers.getContractAt("SiweAuthWikiTruth", wikiTruth_contracts_address.siweAuth);
    const siweAuthConnected = siweAuth.connect(signer) as any;
    
    // Verify if domain is valid
    const isValidDomain = await siweAuth.isDomainValid(primaryDomain);
    if (!isValidDomain) {
        console.error(`❌ Domain ${primaryDomain} is invalid, please add it to the contract first`);
        return;
    }
    console.log(`✅ Domain ${primaryDomain} verification passed`);

    // =========================== Step 2: Generate SIWE message and sign ==================================
    console.log("\n🔐 Step 2: Generating SIWE message and signing...");
    
    // Set expiration time (24 hours later)
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 24);
    
    // Generate SIWE message
    const siweMessage = await getSiweMsg(
        primaryDomain,
        signer,
        chainId,
        expiration,
        `I accept the WikiTruth Terms of Service: https://${primaryDomain}/tos`
    );
    console.log("✅ SIWE message generated successfully");
    
    // Sign SIWE message
    const signature = await erc191sign(siweMessage, signer);
    console.log("✅ SIWE message signed successfully");

    await new Promise(resolve => setTimeout(resolve, 2000));

    // =========================== Step 3: Call login function to get authentication token ==================================
    console.log("\n🔑 Step 3: Calling SiweAuth contract login function to get authentication token...");
    try {
        const authToken = await siweAuthConnected.login(siweMessage, signature);
        console.log("✅ Login successful, authentication token obtained");
        console.log("   Token length:", authToken.length, "bytes");
        
        // Verify if token is valid
        const isTokenValid = await siweAuth.isSessionValid(authToken);
        if (!isTokenValid) {
            console.error("❌ Token verification failed");
            return;
        }
        console.log("✅ Token verification passed");

        // Get user address corresponding to token
        const tokenSender = await siweAuth.getMsgSender(authToken);
        console.log("   User address corresponding to token:", tokenSender);
        console.log("   Signer address:", signerAddress);
        if (tokenSender.toLowerCase() !== signerAddress.toLowerCase()) {
            console.warn("⚠️ Token user address does not match signer address");
        } else {
            console.log("✅ Token user address verification passed");
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        // =========================== Step 4: Use token to read TruthBox contract data ==================================
        console.log("\n📦 Step 4: Using token to read TruthBox contract data...");
        const contractAddress = wikiTruth_contracts_address.truthBox;
        const truthBox = await ethers.getContractAt("TruthBox", contractAddress);
        const truthBoxConnected = truthBox.connect(signer) as any;

        // Read data for multiple boxes
        for (let i = 0; i < boxList.length; i++) {
            const box = boxList[i];
            const boxId = box.boxId;
            
            console.log(`\n📋 Reading Box ${boxId} data...`);
            
            try {
                // Read public data (no token required)
                const [status, price, deadline] = await truthBox.getBasicData(boxId);
                console.log(` ✅ Public data read successfully:`);
                console.log(` - Price: ${price}`);
                
                // Read private data (token required)
                try {
                    const privateData = await truthBoxConnected.getPrivateData(boxId, authToken);
                    console.log(`   ✅ Private data read successfully:`);
                    if (privateData.length > 0) {
                        console.log(` - Data content: ${privateData}`);
                    }
                } catch (error: any) {
                    console.log(`   ⚠️ Private data read failed: ${error.message || error}`);
                    // Possible reasons: not minter/buyer, or state does not allow reading
                }
                
            } catch (error: any) {
                console.log(`   ❌ Box ${boxId} data read failed: ${error.message || error}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 10000));
        }

        console.log("\n✅ All data reading completed!");

    } catch (error: any) {
        console.error("❌ Login failed:", error.message || error);
        if (error.reason) {
            console.error("   Reason:", error.reason);
        }
        return;
    }
}

// Run deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Failed:", error);
        process.exit(1);
    });
