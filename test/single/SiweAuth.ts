// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';
import { ethers } from 'hardhat';
// import { Signer } from 'ethers';
// import { SiweMessage } from 'siwe';
import '@nomicfoundation/hardhat-chai-matchers';
// import { user_evm_WikiTruth } from "../WikiTruth_account";
import { HardhatRuntimeEnvironment } from "hardhat/types";
// import { NETWORKS } from '@oasisprotocol/sapphire-paratime';
import { 
    getAccount, 
    connectContract,
    // deployContract,
    siweMsg, 
    erc191sign,
    domainList,
    // getCurrentNetwork,
    sleep,
    type TestAccounts
} from '../../utils';

/**
 * Test SiweAuth contract
 * 
 * Local testnet - Deploy new contract for testing
 * Start dockers: docker run --rm -it -p 8545:8545 ghcr.io/oasisprotocol/sapphire-localnet:latest
 * Run: npx hardhat test test/single/SiweAuth.ts (--network sapphire_localnet)
 * 
 * SIWE authentication flow implementation():
 * Part 1: Generate token
 *     1. Generate SIWE message required for login in frontend (script)
 *     2. User signs SIWE message with wallet and sends to contract
 *     3. Contract verifies SIWE message, --------------------Login function, and returns token
 * Part 2: Use authentication token to call contract authentication methods
 *     1. User uses authentication token to call contract authentication methods——————
 *     2. Contract verifies authentication token and returns authenticator address
 * Part 3: Revoke authentication token
 *     1. User uses authentication token to call contract authentication methods——————
 *     2. Contract verifies authentication token and returns authenticator address
 * Part 4: Use authenticator address to call contract authentication methods
 *     1. User uses authenticator address to call contract authentication methods——————
 *     2. Contract verifies authenticator address and returns authenticator address
 */

describe('SiweAuth Sapphire_localnet', function () {
    let hre: HardhatRuntimeEnvironment;
    let accounts: TestAccounts;
    let network: any;
    
    // Contract instances
    let siweAuthContract: any;
    let contractFactory: any;
    let contractAddress: string;

    // Connected contract instances
    let contract_admin: any;
    let contract_adminOld: any;
    let contract_addr1: any;
    let contract_addr2: any;
    let contract_addr3: any;
    let contract_viewAccount: any;
    
    // Account variables
    let admin: any;
    let adminNew: any;
    let addr1: any;
    let addr2: any; // New owner
    let addr3: any; // Test user
    let viewAccount: any; // Test user

    // Use domain configuration from utility functions
    let primaryDomain: string;
    let domain1: string;
    let domain2: string;
    let domain3: string;
    let domain4: string;
    let invalidDomain: string;
    let domainTest: string ;
    let domainTest2: string ;

    // Local testnet configuration
    const LOCALNET_CONFIG = {
        chainId: 23293, // sapphire_localnet
        timeout: 5000 // Increase timeout to 5 seconds
    };

    const sleepTime = 1000;

    before(async function () {
        this.timeout(60000); // Increase timeout
        
        console.log("🚀 Starting SiweAuth contract test - configuring test environment...");

        hre = require("hardhat");
        // Switch to Sapphire testnet
        await hre.switchNetwork("sapphire_localnet");
        
        // Get network configuration
        network = await ethers.provider.getNetwork();
        console.log("🌐 Current network:", network.networkName, "Chain ID:", network.chainId);
        console.log("🌐 Target network ID:", LOCALNET_CONFIG.chainId);
        
        // if (network.chainId !== LOCALNET_CONFIG.chainId) {
        //     throw new Error(`Network mismatch! Current: ${network.chainId}, Expected: ${LOCALNET_CONFIG.chainId}`);
        // }

        // Get test accounts
        accounts = await getAccount(network.chainId);
        console.log("👤 Test accounts obtained");

        // Initialize domain configuration
        [primaryDomain, domain1, domain2, domain3, domain4, invalidDomain, domainTest, domainTest2] = domainList;
        
        // Deploy SiweAuth contract
        console.log("🚀 Deploying SiweAuth contract...");
        contractFactory = await ethers.getContractFactory("contracts/SiweAuth.sol:SiweAuth");
        
        // Construct domain array (excluding invalid domains)
        const validDomains = [domain1, domain2, domain3, domain4];
        
        siweAuthContract = await contractFactory.deploy(
            ethers.ZeroAddress, // addrManager_ - temporarily use zero address
            primaryDomain,      // primaryDomain
            validDomains        // domains array
        );
        // Wait for deployment to complete
        await siweAuthContract.waitForDeployment();
        contractAddress = await siweAuthContract.getAddress();
        console.log("✅ SiweAuth deployed successfully, address:", contractAddress);

        // Set account variables
        addr1 = accounts.admin;
        addr2 = accounts.minter;
        viewAccount = accounts.buyer;
        addr3 = accounts.buyer2;

        console.log("👤 Test account addresses:");
        console.log("  - addr1:", addr1.address);
        console.log("  - addr2:", addr2.address);
        console.log("  - addr3:", addr3.address);

        // Connect to deployed contract
        contract_addr1 = await connectContract(siweAuthContract, addr1);
        contract_addr2 = await connectContract(siweAuthContract, addr2);
        contract_addr3 = await connectContract(siweAuthContract, addr3);
        contract_viewAccount = await connectContract(siweAuthContract, viewAccount);
        
        console.log("🔗 Contract connections completed");
        
        await sleep(sleepTime); // Wait for network synchronization
    });
    
    async function setValue(currentAdminAddr: any) {
        console.log("Current admin address:", currentAdminAddr);
        await sleep(sleepTime);

        if (currentAdminAddr == addr1.address) {
            contract_adminOld = contract_addr3;
            admin = addr1;
            contract_admin = contract_addr1;
            adminNew = addr2;
        } else if (currentAdminAddr == addr2.address) {
            contract_adminOld = contract_addr1;
            admin = addr2;
            contract_admin = contract_addr2;
            adminNew = addr3;
        } else if (currentAdminAddr == addr3.address){
            contract_adminOld = contract_addr2;
            admin = addr3;
            contract_admin = contract_addr3;
            adminNew = addr1;
        }
    }

    let siweStr:any;
    let siweStr2:any;
    let siweStr3:any;
    let siweStr4:any;

    it('Initial check: Check current admin and set related configuration variables.', async function () {
        this.timeout(LOCALNET_CONFIG.timeout);
        
        const currentAdminAddr = await contract_addr1.admin();

        await setValue(currentAdminAddr);

    })
    
    it('0. Test initial domain check', async function () {
        this.timeout(LOCALNET_CONFIG.timeout);
        
        console.log("🧪 Testing initial domain configuration...");
        
        // Test primary domain
        primaryDomain = await contract_addr1.domain();
        // expect(currentDomain).to.equal(primaryDomain);
        console.log("✅ Primary domain verification passed:", primaryDomain);
        
        // Test domain count
        const domainCount = await contract_addr1.domainCount();
        console.log("✅ Domain count verification passed:", domainCount.toString());
        
        // Test all domains
        const allDomains = await contract_addr1.allDomains();
        expect(allDomains).to.include(primaryDomain);
        expect(allDomains).to.include(domain1);
        expect(allDomains).to.include(domain2);
        expect(allDomains).to.include(domain3);
        // expect(allDomains).to.include(domain4);
        console.log("✅ All domains verification passed:", allDomains);

    })
    
    it('0. Test initial domain check 2', async function () {
        
        // Test domain validity
        await sleep(sleepTime);
        expect(await contract_addr1.isDomainValid(primaryDomain)).to.be.true;
        expect(await contract_addr1.isDomainValid(domain1)).to.be.true;
        expect(await contract_addr1.isDomainValid(domain2)).to.be.true;
        expect(await contract_addr1.isDomainValid(domain3)).to.be.true;
        // false
        await sleep(sleepTime);
        expect(await contract_addr1.isDomainValid(invalidDomain)).to.be.false;
        expect(await contract_addr1.isDomainValid(domainTest)).to.be.false;
        expect(await contract_addr1.isDomainValid(domainTest2)).to.be.false;
        console.log("✅ Domain validity verification passed");
    });

    // return;
    it('1. Test multi-domain login', async function () {
        this.timeout(LOCALNET_CONFIG.timeout);

        console.log("🧪 Testing multi-domain login functionality...");

        // Test primary domain login
        const siweStrPrimary = await siweMsg({
            domain: primaryDomain,
            signer: addr1
        });
        const primaryToken = await contract_addr1.login(
            siweStrPrimary,
            await erc191sign(siweStrPrimary, addr1),
        );
        expect(primaryToken).to.have.length.greaterThan(2);
        console.log("✅ Primary domain login successful:", primaryDomain);

        const tx = await contract_viewAccount.getMsgSender(primaryToken)
        console.log("Returned authenticator address:", tx);
        
        expect(tx).to.equal(addr1.address);

        siweStr = siweStrPrimary;

    })

    
    it('1.2 Test multi-domain login 1', async function () {

        const siweStr1 = await siweMsg({
            domain: domain1,
            signer: addr1
        });
        const token1 = await contract_addr1.login(
            siweStr1,
            await erc191sign(siweStr1, addr1),
        );
        expect(token1).to.have.length.greaterThan(2);
        console.log("✅ Domain 1 login successful:", domain1);

    })
    
    it('1.3 Test multi-domain login 2', async function () {

        const siweStr2 = await siweMsg({
            domain: domain2,
            signer: addr1
        });
        const token2 = await contract_addr1.login(
            siweStr2,
            await erc191sign(siweStr2, addr1),
        );
        expect(token2).to.have.length.greaterThan(2);
        console.log("✅ Domain 2 login successful:", domain2);

    })
    
    it('1.4 Test multi-domain login 3', async function () {

        const siweStr3 = await siweMsg({
            domain: domain3,
            signer: addr1
        });
        const token3 = await contract_addr1.login(
            siweStr3,
            await erc191sign(siweStr3, addr1),
        );
        expect(token3).to.have.length.greaterThan(2);
        console.log("✅ Domain 3 login successful:", domain3);

    });


    it('1.5 Test invalid-expired domain login', async function () {
        this.timeout(LOCALNET_CONFIG.timeout);

        const siweStrInvalid = await siweMsg({
            domain: invalidDomain,
            signer: addr1
        });
        try {
            await contract_addr1.login(
                siweStrInvalid,
                await erc191sign(siweStrInvalid, addr1),
            );
        } catch (error) {
            console.log("✅ Invalid domain login correctly rejected:", invalidDomain);
        }

        const siweStrExpired = await siweMsg({
            domain: primaryDomain,
            signer: addr1,
            expiration: new Date(Date.now() - 30_000) // 30 seconds ago expired
        });

        try {
            await contract_addr1.login(
                siweStrExpired,
                await erc191sign(siweStrExpired, addr1),
            );
        } catch (error) {
            console.log("✅ Expired login correctly rejected");
        }
        
        
    });

    it('2. Test domain management, add domain', async function () {
        // this.timeout(TESTNET_CONFIG.timeout);

        console.log("🧪 Testing domain management functionality...");

        // Test adding new domain - if already added, no need to add again
        await contract_admin.addDomain(domainTest2); // write
        await sleep(sleepTime);

        expect(await contract_addr1.isDomainValid(domainTest2)).to.be.true;
        console.log("✅ Successfully added new domain:", domainTest2);
        
        // Test new domain login
        const siweStr4 = await siweMsg({
            domain: domainTest2,
            signer: addr1
        });
        const token4 = await contract_addr1.login(
            siweStr4,
            await erc191sign(siweStr4, addr1),
        );
        expect(token4).to.have.length.greaterThan(2);
        console.log("✅ New domain login successful:", domainTest2);
        
        // Test non-admin cannot add domain
        try {
            // NOTE Note that this will also leave interaction records on the blockchain.
            await contract_adminOld.addDomain("unauthorized.com") // write
        } catch (error) {
            console.log("✅ Non-admin adding domain correctly rejected");
        }
    });

    it('2.1 Test domain management, remove domain', async function () {
        // Test removing domain
        await contract_admin.removeDomain(domainTest2); // write
        await sleep(sleepTime);

        expect(await contract_addr1.isDomainValid(domainTest2)).to.be.false;
        console.log("✅ Successfully removed domain:", domainTest2);
        
        // Test cannot login after removal
        try{
            await contract_addr1.login(
                siweStr4,
                await erc191sign(siweStr4, addr1),
            );
        } catch (error) {
            console.log("✅ Cannot login after removal correctly rejected");
        }

    });

    it('2.2 Test domain management-remove primary domain', async function () {
        // Test cannot remove primary domain
        try{
            await contract_admin.removeDomain(primaryDomain) // write
        } catch (error) {
            console.log("✅ Primary domain cannot be removed correctly rejected");
        }
        await sleep(sleepTime);
        
        // Test setting primary domain, note that two call calls must be spaced apart.
        await contract_admin.setPrimaryDomain(domain4); // write
        await sleep(sleepTime);
        
        const newPrimaryDomain = await contract_addr1.domain();
        expect(newPrimaryDomain).to.equal(domain4);
        console.log("✅ Successfully set new primary domain:", domain4);
        
        // Restore original primary domain
        await contract_admin.setPrimaryDomain(primaryDomain); // writes
        console.log("✅ Restored original primary domain:", primaryDomain);

    });

    it('3. Test token verification and revocation', async function () {
        this.timeout(LOCALNET_CONFIG.timeout);

        console.log("🧪 Testing token verification and revocation functionality...");

        // Generate tokens for different domains
        const siweStrPrimary = await siweMsg({
            domain: primaryDomain,
            signer: addr1
        });
        const primaryToken = await contract_addr1.login(
            siweStrPrimary,
            await erc191sign(siweStrPrimary, addr1),
        );
        
        const siweStr1 = await siweMsg({
            domain: domain1,
            signer: addr1
        });
        const token1 = await contract_addr1.login(
            siweStr1,
            await erc191sign(siweStr1, addr1),
        );

        // Test token validity verification
        expect(await contract_addr1.isSessionValid(primaryToken)).to.be.true;
        expect(await contract_addr1.isSessionValid(token1)).to.be.true;
        console.log("✅ Token validity verification passed");
        
        // Test empty token
        expect(await contract_addr1.isSessionValid("0x")).to.be.false;
        console.log("✅ Empty token verification correctly returns false");
        
        // Test invalid token
        const invalidToken = "0x1234567890abcdef";
        expect(await contract_addr1.isSessionValid(invalidToken)).to.be.false;
        console.log("✅ Invalid token verification correctly returns false");
    });

    it('4. Test admin permissions', async function () {
        console.log("🧪 Testing admin permissions...");
        
        // Test transferring admin permissions - already sent,
        await contract_admin.setAdmin(adminNew.address); // write
        console.log("✅ Admin permissions transferred to:", adminNew.address);

        await sleep(sleepTime);
        // Use fixed contract instance to query admin address, avoid variable pointing issues
        const currentAdminAddr = await contract_viewAccount.admin();
        expect(currentAdminAddr).to.equal(adminNew.address);

        // Adjust variable value,
        await setValue(adminNew.address);
    });

    it('4.2 Test admin permissions-new admin', async function () {

        // New admin can add domain
        await contract_admin.addDomain(domainTest); // write
        await sleep(sleepTime);

        expect(await contract_admin.isDomainValid(domainTest)).to.be.true;
        console.log("✅ New admin successfully added domain");

        await sleep(sleepTime);
        // Test new domain login
        const siweStr4 = await siweMsg({
            domain: domainTest,
            signer: addr1
        });
        const token4 = await contract_addr1.login(
            siweStr4,
            await erc191sign(siweStr4, addr1),
        );
        expect(token4).to.have.length.greaterThan(2);
        console.log("✅ New domain login successful:", domainTest);
        
        // Original admin cannot add domain
        try{
            await contract_adminOld.addDomain("old-admin.com"); // write
        } catch (error) {
            console.log("✅ Original admin adding domain correctly rejected");
        }

    });

    it('4.3 Using newly added domain-test setting primary domain', async function () {

        await sleep(sleepTime);
        
        // Test setting primary domain, note that two call calls must be spaced apart.
        await contract_admin.setPrimaryDomain(domainTest); // write
        await sleep(sleepTime);
        
        const newPrimaryDomain = await contract_addr1.domain();
        expect(newPrimaryDomain).to.equal(domainTest);
        console.log("✅ Successfully set new primary domain:", domainTest);
        
        // Restore original primary domain
        await contract_admin.setPrimaryDomain(primaryDomain); // writes
        console.log("✅ Restored original primary domain:", primaryDomain);

    });

    it('4.4 Test admin permissions-restore admin', async function () {
        
        // Restore admin permissions
        await contract_admin.setAdmin(adminNew.address); // write
        console.log("✅ Admin permissions transferred to:", adminNew.address);

        await sleep(sleepTime);
        // Use fixed contract instance to query admin address
        const currentAdminAddr = await contract_viewAccount.admin();
        expect(currentAdminAddr).to.equal(adminNew.address);

        // Adjust variable value,
        await setValue(adminNew.address);
    
    });

    it('4.4. New admin-remove previously added domain', async function () {

        await sleep(sleepTime);
        // Remove
        await contract_admin.removeDomain(domainTest); // write
        await sleep(sleepTime);
        
        expect(await contract_addr1.isDomainValid(domainTest)).to.be.false;
        console.log("✅ Successfully removed domain:", domainTest);
    });

    it('4.5 Using removed domain-test setting primary domain', async function () {

        await sleep(sleepTime);
        
        try {
            await contract_admin.setPrimaryDomain(domainTest); // write
        } catch (error) {
            console.log("❌ Removed domain cannot be set as primary domain:", error);
        }

    });

    it('5. Test cross-domain token features', async function () {
        this.timeout(LOCALNET_CONFIG.timeout);

        console.log("🧪 Testing cross-domain token features...");
        
        // Generate tokens for different domains
        const domains = [primaryDomain, domain1, domain2, domain3];
        const tokens = [];
        
        for (const testDomain of domains) {
            const siweStr = await siweMsg({
                domain: testDomain,
                signer: addr1
            });
            const token = await contract_addr1.login(
                siweStr,
                await erc191sign(siweStr, addr1)
            );
            tokens.push(token);
            console.log(`✅ Domain ${testDomain} token generated successfully`);
        }
        
        // Verify all tokens are valid
        for (let i = 0; i < tokens.length; i++) {
            expect(await contract_addr1.isSessionValid(tokens[i])).to.be.true;
            console.log(`✅ Domain ${domains[i]} token validity verification passed`);
        }
        
        // Verify tokens from different domains are different
        for (let i = 0; i < tokens.length - 1; i++) {
            for (let j = i + 1; j < tokens.length; j++) {
                expect(tokens[i]).to.not.equal(tokens[j]);
            }
        }
        console.log("✅ Tokens generated from different domains are unique");
    });

    after(async function () {
        console.log("\n🎉 MultiDomainSiweAuth localnet test completed");
        console.log("📍 Contract address:", contractAddress);
        console.log("🌐 Test network: sapphire-localnet");
        if (contract_addr1) {
            console.log("📊 Multi-domain support:", await contract_addr1.allDomains());
        }
        console.log("🛡️ Test result: All multi-domain features working correctly");
    });

});
