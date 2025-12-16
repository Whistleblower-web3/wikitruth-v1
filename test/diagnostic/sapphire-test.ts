import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * Sapphire encryption functionality diagnostic test
 * 
 * Used to check if Sapphire local network correctly supports encryption functionality
 * 
 * Run command:
 * npx hardhat test test/diagnostic/sapphire-test.ts --network sapphire_localnet
 */

describe("Sapphire Encryption Functionality Diagnostic", function () {
    let hre: HardhatRuntimeEnvironment;
    let testContract: any;
    let owner: any;

    before(async function () {
        this.timeout(60000);
        
        hre = require("hardhat");
        
        console.log("🌐 Switching to sapphire_localnet local testnet...");
        await hre.switchNetwork("sapphire_localnet");
        
        const network = await ethers.provider.getNetwork();
        console.log("📡 Network info - chainId:", network.chainId, "name:", network.name);
        
        // Get test accounts
        [owner] = await ethers.getSigners();
        console.log("👤 Test account:", owner.address);
    });

    describe("1. Basic Network Connection Test", function () {
        it("should be able to get block number", async function () {
            const blockNumber = await ethers.provider.getBlockNumber();
            console.log("✅ Current block number:", blockNumber);
            expect(blockNumber).to.be.gte(0);
        });

        it("should be able to get account balance", async function () {
            const balance = await ethers.provider.getBalance(owner.address);
            console.log("✅ Account balance:", ethers.formatEther(balance), "ETH");
            expect(balance).to.be.gt(0);
        });
    });

    describe("2. Sapphire Encryption Functionality Test", function () {
        it("should be able to deploy contracts using encryption functionality", async function () {
            const MockERC20Factory = await ethers.getContractFactory("MockERC20");
            const mockToken = await MockERC20Factory.connect(owner).deploy("Test Token", "TEST");
            await mockToken.waitForDeployment();
            
            const mockAddress = await mockToken.getAddress();
            console.log("✅ MockERC20 deployed successfully:", mockAddress);

            const ERC20SecretFactory = await ethers.getContractFactory("ERC20Secret");
            testContract = await ERC20SecretFactory.connect(owner).deploy(mockAddress);
            await testContract.waitForDeployment();
            
            const contractAddress = await testContract.getAddress();
            console.log("✅ ERC20Secret deployed successfully:", contractAddress);
        });

        it("should be able to get global nonce", async function () {
            try {
                const nonce = await testContract.getGlobalNonce();
                console.log("✅ Global Nonce:", nonce);
                expect(nonce).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
            } catch (error: any) {
                console.error("❌ Failed to get Nonce:", error.message);
                throw error;
            }
        });

        it("should be able to read encrypted balance (even if 0)", async function () {
            try {
                const balance = await testContract.getDecryptBalance(owner.address);
                console.log("✅ Decrypted balance successfully:", balance.toString());
                expect(balance).to.equal(0);
            } catch (error: any) {
                console.error("❌ Failed to decrypt balance:", error.message);
                console.error("This indicates Sapphire encryption functionality is not available!");
                throw error;
            }
        });

        it("should be able to read encrypted raw data", async function () {
            try {
                const rawData = await testContract.getEncryptedBalanceRaw(owner.address);
                console.log("✅ Raw encrypted data length:", rawData.length);
            } catch (error: any) {
                console.error("❌ Failed to read encrypted data:", error.message);
                throw error;
            }
        });
    });

    describe("3. Environment Verification Summary", function () {
        it("environment check report", async function () {
            console.log("\n" + "=".repeat(60));
            console.log("📊 Sapphire Environment Diagnostic Report");
            console.log("=".repeat(60));
            
            const network = await ethers.provider.getNetwork();
            console.log("🌐 Network: sapphire_localnet");
            console.log("🔗 Chain ID:", network.chainId.toString());
            console.log("👤 Test account:", owner.address);
            
            if (testContract) {
                console.log("📝 Test contract:", await testContract.getAddress());
                
                try {
                    const nonce = await testContract.getGlobalNonce();
                    const balance = await testContract.getDecryptBalance(owner.address);
                    
                    console.log("\n✅ Encryption functionality status: Normal");
                } catch (error) {
                    console.log("\n❌ Encryption functionality status: Abnormal");
                }
            }
            
            console.log("=".repeat(60) + "\n");
        });
    });
});

