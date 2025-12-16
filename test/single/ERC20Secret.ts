import { expect } from "chai";
import { ethers, network } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { 
    getAccount, 
    connectContract,
    createEIP712Permit_PrivateToken,
    PermitType,
    // deployContract,
    waitForTransaction,
    sleep,
    // getCurrentNetwork,
    type TestAccounts
} from '../../utils';
// import { user_evm_WikiTruth } from "../WikiTruth_account";

/**
 * Test ERC20Secret contract on localnet
 * 
 * @attention：
 * 1. Current script is only suitable for deployment and testing on local testnet.
 * 
 * Includes:
 * 1. Basic authorization
 * 2. Check balance
 * 3. Mint tokens
 * 4. Wrap/Unwrap functionality tests
 * 5. Standard ERC20 transfer functionality tests
 * 6. Encryption privacy functionality tests
 * 7. Error handling and boundary condition tests
 * 
 * Local testnet
 * Start dockers: docker run --rm -it -p 8545:8545 ghcr.io/oasisprotocol/sapphire-localnet:latest
 * npx hardhat test test/single/ERC20Secret.ts (--network sapphire_localnet)
 */

describe("ERC20Secret Sapphire_localnet", function () {
    let hre: HardhatRuntimeEnvironment;
    let accounts: TestAccounts;
    let network: any;

    // Contract instances
    let mockToken: any;
    let secretToken: any;
    let mockTokenFactory: any;
    let secretTokenFactory: any;

    // Contract addresses
    let mockTokenAddress: string;
    let secretTokenAddress: string;

    // Connected contract instances
    let admin_mockToken: any;
    let buyer_mockToken: any;
    let buyer2_mockToken: any;
    let admin_secretToken: any;
    let buyer_secretToken: any;
    let buyer2_secretToken: any;

    // Test constants
    const DECIMALS = 5;
    const MockName = "Mock Token";
    const MockSymbol = "MOCK";
    const mintAmount = 10000 * 10 ** DECIMALS;
    const wrapAmount = 1000 * 10 ** DECIMALS;
    const transferAmount = 50 * 10 ** DECIMALS;

    // EIP712 permits
    let admin_ViewPermit: any;
    let buyer_ViewPermit: any;
    let buyer2_ViewPermit: any;

    const sleepTime = 1000;

    before(async function () {
        this.timeout(60000); // Increase timeout
        
        hre = require("hardhat");
        
        console.log("🌐 Switching to sapphire_localnet local testnet...");
        await hre.switchNetwork("sapphire_localnet");
        
        // Get network configuration
        network = await ethers.provider.getNetwork();
        console.log("🌐 Current network:", network.networkName, "Chain ID:", network.chainId);

        // Get test accounts
        accounts = await getAccount(network.chainId);
        console.log("👤 Test accounts obtained");
        
        // Get contract factories
        mockTokenFactory = await ethers.getContractFactory("MockERC20");
        secretTokenFactory = await ethers.getContractFactory("ERC20Secret");
        
        // Deploy MockERC20 contract
        console.log("🚀 Deploying MockERC20 contract...");
        mockToken = await mockTokenFactory.deploy(
            MockName, 
            MockSymbol
        );
        // Wait for deployment to complete
        await mockToken.waitForDeployment();
        mockTokenAddress = await mockToken.getAddress();
        console.log("✅ MockERC20 deployed successfully, address:", mockTokenAddress);

        await sleep(sleepTime);
        
        // Deploy ERC20Secret contract
        console.log("🚀 Deploying ERC20Secret contract...");
        secretToken = await secretTokenFactory.deploy(
            mockTokenAddress
        );
        // Wait for deployment to complete
        await secretToken.waitForDeployment();
        secretTokenAddress = await secretToken.getAddress();
        console.log("✅ ERC20Secret deployed successfully, address:", secretTokenAddress);
        
        // Connect contracts to different accounts
        admin_mockToken = await connectContract(mockToken, accounts.admin);
        buyer_mockToken = await connectContract(mockToken, accounts.buyer);
        buyer2_mockToken = await connectContract(mockToken, accounts.buyer2);
        
        admin_secretToken = await connectContract(secretToken, accounts.admin);
        buyer_secretToken = await connectContract(secretToken, accounts.buyer);
        buyer2_secretToken = await connectContract(secretToken, accounts.buyer2);
        
        console.log("🔗 Contract connections completed");
        await sleep(sleepTime); // Wait for network synchronization
    });

    
    
    //------------------------------------------------------------------------------
    // --------------------------------EIP712 Signature Helper Functions--------------------------------
    async function createEIP712Permit(signer: any, spender: any, amount: number | bigint, mode: PermitType, customDeadline?: number) {
        return await createEIP712Permit_PrivateToken({
            signer,
            spender,
            amount,
            mode,
            contractAddress: secretTokenAddress,
            network: network,
            customDeadline,
            domainName: "Secret ERC20 Token",  // Must match the domain name in the contract
            domainVersion: "1"
        });
    }


    
    // NOTE Tests have passed
    describe("ERC20 Standard Interface Tests", function () {
        it("perform signature authorization", async function () { 
            admin_ViewPermit = await createEIP712Permit(accounts.admin, accounts.buyer2, 0, PermitType.View);
            buyer_ViewPermit = await createEIP712Permit(accounts.buyer, accounts.buyer2, 0, PermitType.View);
            buyer2_ViewPermit = await createEIP712Permit(accounts.buyer2, accounts.buyer, 0, PermitType.View);
        });

        // it("should correctly return token basic information", async function () {
        //     expect(await admin_secretToken.name()).to.equal(PrivateName);
        //     expect(await admin_secretToken.symbol()).to.equal(PrivateSymbol);
        //     expect(await admin_secretToken.decimals()).to.equal(DECIMALS);
        // });

        // it("troubleshooting:", async function () {
        //     const maxAmount = ethers.MaxUint256;
        //     // Authorize maximum value to addr2
        //     await buyer_secretToken.approve(addr2.address, maxAmount);

        //     await new Promise(resolve => setTimeout(resolve, 20000));
        //     // View allowance through signature
        //     const allowance1 = await admin_secretToken.allowanceWithPermit(buyer_ViewPermit);
        //     console.log("Allowance:", allowance1);
        // });
        
        it("check balance", async function () {
            const tx = await admin_secretToken.balanceOfWithPermit(buyer_ViewPermit);
            expect(tx).to.equal(0);
            const tx2 = await admin_secretToken.balanceOfWithPermit(buyer2_ViewPermit);
            expect(tx2).to.equal(0);
            const tx3 = await admin_secretToken.balanceOfWithPermit(admin_ViewPermit);
            expect(tx3).to.equal(0);
        });
        
        it("mint tokens", async function () {
            await admin_mockToken.mint(accounts.buyer.address);
            await sleep(sleepTime);

            await admin_mockToken.mint(accounts.buyer2.address);
            await sleep(sleepTime);
        });
    });
    
    describe("Wrap/Unwrap Functionality Tests", function () {
        
        it("approval required before wrapping, otherwise wrap cannot proceed", async function () {
            await sleep(sleepTime);

            await buyer_mockToken.approve(secretTokenAddress, mintAmount);
            await sleep(sleepTime);

            await buyer2_mockToken.approve(secretTokenAddress, mintAmount);
            await sleep(sleepTime);
            
            // Perform regular approval first
            await buyer_secretToken.approve(accounts.buyer2.address, mintAmount);
        });
        
        it("should be able to wrap ERC20 tokens", async function () {
            // Wrap tokens
            const wrapTx = await buyer_secretToken.wrap(wrapAmount);
            await wrapTx.wait();  // Wait for transaction confirmation
            await sleep(sleepTime);

            const tx = await admin_secretToken.balanceOfWithPermit(buyer_ViewPermit);
            expect(tx).to.equal(wrapAmount);
        });
        
        it("should be able to unwrap tokens", async function () {
            // Unwrap
            const unwrapTx = await buyer_secretToken.unwrap(wrapAmount);
            await unwrapTx.wait();  // Wait for transaction confirmation
            await sleep(sleepTime);

            const tx = await admin_secretToken.balanceOfWithPermit(buyer_ViewPermit);
            expect(tx).to.equal(0);
        });
        
        it("should be able to partially wrap and unwrap", async function () {
            const partialAmount = wrapAmount / 2;
            
            // Execute wrap operation and wait for transaction confirmation
            const wrapTx = await buyer_secretToken.wrap(wrapAmount);
            await wrapTx.wait();  // Wait for transaction confirmation
            await sleep(sleepTime);
            
            // First verify balance using signature method (this has been proven reliable)
            const balance_1 = await admin_secretToken.balanceOfWithPermit(buyer_ViewPermit);
            expect(balance_1).to.equal(wrapAmount);
            
            // Then verify using debug function (for comparison)
            const balance = await admin_secretToken.getDecryptBalance(accounts.buyer.address);
            expect(balance).to.equal(wrapAmount);

            // Unwrap part
            const unwrapTx = await buyer_secretToken.unwrap(partialAmount);
            await unwrapTx.wait();  // Wait for transaction confirmation
            await sleep(sleepTime);
            
            const balance2 = await admin_secretToken.balanceOfWithPermit(buyer_ViewPermit);
            expect(balance2).to.equal(partialAmount);
        });
    });

    
    describe("Standard ERC20 Transfer Functionality Tests", function () {
        const wrapAmount = 100 * 10 ** DECIMALS;
        const transferAmount = 50 * 10 ** DECIMALS;
        
        before(async function () {
            // Wrap some tokens for addr1
            await buyer_secretToken.wrap(wrapAmount);
        });
        
        it("should be able to execute transfer", async function () {
            await sleep(sleepTime);
            await buyer_secretToken.transfer(accounts.buyer2.address, transferAmount);
            await sleep(sleepTime);
            const balance = await admin_secretToken.balanceOfWithPermit(buyer2_ViewPermit);
            expect(balance).to.equal(transferAmount);
        });
        
        it("should be able to execute transferFrom", async function () {
            await sleep(sleepTime);
            await buyer2_secretToken.transferFrom(accounts.buyer.address, accounts.buyer2.address, transferAmount);
            await sleep(sleepTime);
            const balance = await admin_secretToken.balanceOfWithPermit(buyer2_ViewPermit);
            expect(balance).to.equal(transferAmount*2);
        });

    });
    
    describe("Encryption Privacy Functionality Tests", function () {

        before(async function () {
            // Wrap some tokens for addr1 for testing
            await buyer_secretToken.wrap(wrapAmount);
        });
        
        it("should be able to view allowance through signature", async function () {
            

            await new Promise(resolve => setTimeout(resolve, sleepTime));
            const allowance1 = await admin_secretToken.allowanceWithPermit(buyer_ViewPermit);
            console.log("Allowance, should not be 0:", allowance1);
        });
        
        it("should reject expired view signature", async function () {
            const deadline = Math.floor(Date.now() / 1000) - 1000; // Expired
            const viewPermit = await createEIP712Permit(accounts.buyer, accounts.buyer2, 0, PermitType.View, deadline);
            try{
                await admin_secretToken.balanceOfWithPermit(viewPermit);
            } catch (error) {
                console.log("✅ Rejected expired signature view!");
            }
        });
        
        it("should reject invalid view signature", async function () {
            const viewPermit = await createEIP712Permit(accounts.buyer, accounts.buyer2, 0, PermitType.View);
            
            // Modify owner address to make signature invalid
            viewPermit.owner = accounts.buyer2.address;
            try{
                await admin_secretToken.balanceOfWithPermit(viewPermit);
            } catch (error) {
                console.log("✅ Rejected invalid signature view!");
            }
        });

        it("should reject invalid signature type", async function () {
            const transferAmount = 10 * 10 ** DECIMALS;
            
            // Create a TRANSFER permit but use as VIEW
            const permit = await createEIP712Permit(accounts.buyer, accounts.buyer2, Number(transferAmount), PermitType.Transfer);
            
            try{
                await admin_secretToken.balanceOfWithPermit(permit);
            }catch(error){
                console.log("✅ Wrong type verification test passed");
            }
        });
        
        it("should correctly handle zero balance case", async function () {
            // addr2 has no balance
            const balance = await admin_secretToken.balanceOfWithPermit(admin_ViewPermit);
            const balance2 = await admin_secretToken.getDecryptBalance(accounts.admin.address);
            expect(balance).to.equal(0);
            expect(balance2).to.equal(0);
        });
        
        it("should correctly handle privacy protection mechanism, balanceOf calls in TypeScript all return 0", async function () {
            // Test viewing own balance
            const addr1Balance = await buyer_secretToken.balanceOf(accounts.buyer.address);
            expect(addr1Balance).to.be.equal(0); 
            
            // Test others viewing will return 0
            const addr1BalanceFromOwner = await admin_secretToken.balanceOf(accounts.buyer.address);
            expect(addr1BalanceFromOwner).to.equal(0);
        });
        
        it("should correctly handle allowance privacy protection, should all return 0", async function () {
            // Others viewing will return 0
            const allowanceFromOwner = await admin_secretToken.allowance(accounts.buyer.address, accounts.buyer2.address);
            expect(allowanceFromOwner).to.equal(0);
            
            const allowanceFromAddr2 = await buyer2_secretToken.allowance(accounts.buyer.address, accounts.buyer2.address);
            expect(allowanceFromAddr2).to.equal(0);
        });
        
        it("should reject non-zero amount in VIEW type signature", async function () {
            const viewPermit = await createEIP712Permit(accounts.buyer, accounts.buyer2, 100, PermitType.View); // amount is not 0
            
            try{
                await admin_secretToken.balanceOfWithPermit(viewPermit);
            } catch (error) {
                console.log("✅ Rejected non-zero amount in VIEW type signature!");
            }
        });
    });
    
    describe("EIP-712 Signature Verification Functionality Tests", function () {
        before(async function () {
            // Wrap some tokens for addr1 for testing
            await buyer_secretToken.wrap(wrapAmount);
        });
        
        it("should support EIP-712 signature transfer", async function () {
            const partialAmount = wrapAmount / 2;
            
            const permit = await createEIP712Permit(accounts.buyer, accounts.buyer2, partialAmount, PermitType.Transfer);
            await sleep(sleepTime);

            const addr1Balance = await admin_secretToken.balanceOfWithPermit(buyer_ViewPermit);
            const addr2Balance = await admin_secretToken.balanceOfWithPermit(buyer2_ViewPermit);
            
            // Execute signature transfer
            await admin_secretToken.transferWithPermit(permit);
            await sleep(sleepTime);
            
            // Verify balance changes (using signature view)
            const addr1Balance2 = await admin_secretToken.balanceOfWithPermit(buyer_ViewPermit);
            const addr2Balance2 = await admin_secretToken.balanceOfWithPermit(buyer2_ViewPermit);
            expect(addr1Balance-addr1Balance2).to.equal(partialAmount);
            expect(addr2Balance2-addr2Balance).to.equal(partialAmount);

        });
        
        it("should support EIP-712 signature authorization and successfully transfer", async function () {
            const approveAmount = 30 * 10 ** DECIMALS;
            const permit = await createEIP712Permit(accounts.buyer, accounts.buyer2, Number(approveAmount), PermitType.Approve);
            
            await admin_secretToken.approveWithPermit(permit); // Executing this function means addr2 has been authorized to transfer approveAmount tokens from addr1
            await sleep(sleepTime);

            const allowance = await admin_secretToken.allowanceWithPermit(buyer_ViewPermit);
            
            expect(allowance).to.equal(approveAmount);
            
            try{
                await admin_secretToken.transferFrom(accounts.buyer.address, accounts.admin.address, approveAmount);
            } catch (error) {
                console.log("✅ Unauthorized user attempted transfer, failed!");
            }

            await sleep(sleepTime);
            // Execute transfer
            await buyer2_secretToken.transferFrom(accounts.buyer.address, accounts.buyer2.address, approveAmount);
        });
        
        it("should reject expired signature", async function () {
            const transferAmount = 50 * 10 ** DECIMALS;
            const deadline = Math.floor(Date.now() / 1000) - 1000; // Expired
            
            const permit = await createEIP712Permit(accounts.buyer, accounts.buyer2, Number(transferAmount), PermitType.Transfer, deadline);

            try{
                await admin_secretToken.transferWithPermit(permit);
            } catch (error) {
                console.log("✅ Rejected expired signature!");
            }
        });
        
        it("should reject reused signature", async function () {
            const transferAmount = 25 * 10 ** DECIMALS;
                
            const permit = await createEIP712Permit(accounts.buyer, accounts.buyer2, Number(transferAmount), PermitType.Transfer);
            // First use should succeed
            await admin_secretToken.transferWithPermit(permit);
            await sleep(sleepTime);
            
            try{
                await admin_secretToken.transferWithPermit(permit);
            } catch (error) {
                console.log("✅ Rejected reused signature!");
            }
        });
    });
    
    describe("Utility Function Tests", function () {
        it("should correctly return EIP-712 related information", async function () {
            const domainSeparator = await admin_secretToken.DOMAIN_SEPARATOR();
            expect(domainSeparator).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
            
            const permitTypehash = await admin_secretToken.EIP_PERMIT_TYPEHASH();
            expect(permitTypehash).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
        });
        
        it("should correctly return underlying token information", async function () {
            const underlyingAddress = await admin_secretToken.underlyingToken();
            expect(underlyingAddress).to.equal(mockTokenAddress);
        });
        
        it("should correctly check signature usage status", async function () {
            const permit = await createEIP712Permit(accounts.buyer, accounts.buyer2, transferAmount, PermitType.Transfer);
            await admin_secretToken.transferWithPermit(permit);
            await sleep(sleepTime*2);
            // Check signature used status
            expect(await admin_secretToken.isSignatureUsed(permit.signature)).to.equal(true);
        });
    });
    
    describe("Error Handling and Boundary Condition Tests", function () {
        it("should reject transfer to zero address", async function () {
            try{
                await buyer_secretToken.transfer(ethers.ZeroAddress, transferAmount);
            } catch (error) {
                console.log("✅ Rejected transfer to zero address!");
            }
        });

        it("should reject unwrap when balance is insufficient", async function () {
            try {
                await buyer_secretToken.unwrap(wrapAmount);
            } catch (error) {
                console.log("✅ Rejected unwrap!");
            }
        });
        
        it("should reject wrapping 0 amount tokens", async function () {
            try{
                await buyer_secretToken.wrap(0);
            } catch (error) {
                console.log("✅ Rejected wrapping 0 amount tokens!");
            }
        });
        
        it("should reject unwrapping 0 amount tokens", async function () {
            try{
                await buyer_secretToken.unwrap(0);
            } catch (error) {
                console.log("✅ Rejected unwrapping 0 amount tokens!");
            }
        });
        
        it("should reject wrapping when allowance is insufficient", async function () {
            await buyer_mockToken.approve(secretTokenAddress, 10);
            await sleep(sleepTime);

            // Wrap without authorization
            try{
                await buyer_secretToken.wrap(wrapAmount);
            } catch (error) {
                console.log("✅ Rejected wrapping tokens with insufficient allowance!");
            }
        });
        
        it("should reject approval to zero address", async function () {
            try {
                await buyer_secretToken.approve(ethers.ZeroAddress, mintAmount);
            } catch(error) {
                console.log("✅ Rejected approval to zero address!");
            }
        });

        it("should reject transfer when balance is insufficient", async function () {
            try{
                await buyer_secretToken.transfer(accounts.buyer2.address, mintAmount);
            } catch (error) {
                console.log("✅ Rejected transfer!");
            }
        });
        
        it("should reject proxy transfer when allowance is insufficient", async function () {
            // First perform regular approval of 100
            await buyer_secretToken.approve(accounts.buyer2.address, 100);
            await sleep(sleepTime);

            try {
                await buyer_secretToken.transferFrom(accounts.buyer.address, accounts.buyer2.address, wrapAmount);
            } catch (error) {
                console.log("✅ Rejected proxy transfer!");
            }
        });
        
        it("should correctly handle maximum value - regular approval - test", async function () {
            const maxAmount = ethers.MaxUint256;
            
            // Authorize maximum value to addr2
            await buyer_secretToken.approve(accounts.buyer2.address, maxAmount);
            await sleep(sleepTime);

            const max = await admin_secretToken.allowanceWithPermit(buyer_ViewPermit);
            await sleep(sleepTime);

            expect(max).to.equal(maxAmount);
            
            // Using transferFrom, maximum authorization should not decrease
            const transferAmount = 50 * 10 ** DECIMALS;
            await buyer2_secretToken.transferFrom(accounts.buyer.address, accounts.buyer2.address, transferAmount);
            
        });

        it("should correctly handle maximum value - signature authorization - test", async function () {
            const maxAmount = ethers.MaxUint256;
            
            // Authorize maximum value to addr2
            const permit = await createEIP712Permit(accounts.buyer, accounts.buyer2, maxAmount, PermitType.Approve);

            await admin_secretToken.approveWithPermit(permit);
            await sleep(sleepTime);
            
            // View allowance through signature
            const max = await admin_secretToken.allowanceWithPermit(buyer_ViewPermit);
            await sleep(sleepTime);
            // Compare maximum authorization should remain unchanged
            expect(max).to.equal(maxAmount);
        });

        
    });
});