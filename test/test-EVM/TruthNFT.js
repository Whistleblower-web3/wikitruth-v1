// Test TruthNFT contract functionality, such as sending, adding to blacklist, removing from blacklist, setting URI\CID, etc.
const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { deployTruthBoxFixture } = require("./Fixture.js");
const { Status } = require("./helpers.js");

describe("TruthNFT Tests", function () {
    // Test NFT transfer functionality
    it("should correctly transfer NFT", async function () {
        const {
            minter, buyer, other, admin, dao, address_zero,
            truthNFT, truthBox_minter, truthBox_buyer, truthBox_DAO,
            nft_minter, nft_buyer, nft_other, exchange_minter, exchange_buyer
        } = await loadFixture(deployTruthBoxFixture);

        // Check initial owner
        expect(await truthNFT.ownerOf(0)).to.equal(minter.address);

        // Complete transaction
        await exchange_minter.sell(0, address_zero, 2000);
        await exchange_buyer.buy(0);
        await exchange_buyer.completeOrder(0);

        // Transfer NFT
        await nft_minter.transferFrom(minter.address, buyer.address, 0);

        // Verify owner after transfer
        expect(await truthNFT.ownerOf(0)).to.equal(buyer.address);

        // Transfer from buyer to other
        await nft_buyer.transferFrom(buyer.address, other.address, 0);
        expect(await truthNFT.ownerOf(0)).to.equal(other.address);
    });

    // Test adding to blacklist functionality
    it("should correctly add to blacklist", async function () {
        const {
            minter, buyer, admin, dao,
            truthNFT, truthBox, truthBox_minter,
            nft_minter, nft_DAO,truthBox_DAO
        } = await loadFixture(deployTruthBoxFixture);

        // In initial state, NFT should not be in blacklist
        expect(await truthBox.isInBlacklist(0)).to.equal(false);
        expect(await truthBox.isInBlacklist(1)).to.equal(false);

        // Only DAO can add to blacklist
        await expect(truthBox_minter.addBoxToBlacklist(0)).to.be.revertedWithCustomError(truthBox, "NotDAO");

        // DAO adds to blacklist
        await truthBox_DAO.addBoxToBlacklist(0);
        await truthBox_DAO.addBoxToBlacklist(1);

        // Verify blacklist status
        expect(await truthBox.isInBlacklist(0)).to.equal(true);
        expect(await truthBox.isInBlacklist(1)).to.equal(true);
        expect(await truthBox.isInBlacklist(2)).to.equal(false);

        // When NFT is in blacklist, cannot transfer
        await expect(nft_minter.transferFrom(minter.address, buyer.address, 0))
            .to.be.reverted;
    });

    // Test impact of blacklist on TruthBox operations
    it("blacklisted NFT should not be able to perform operations in TruthBox", async function () {
        const {
            minter, buyer, admin, dao,
            truthNFT, truthBox, truthBox_minter, address_zero,
            exchange_minter, testToken,truthBox_DAO
        } = await loadFixture(deployTruthBoxFixture);

        // Add to blacklist
        await truthBox_DAO.addBoxToBlacklist(0);

        // Blacklisted NFT cannot be sold
        await expect(exchange_minter.sell(0, address_zero, 2000)).to.be.reverted;

        // Blacklisted NFT cannot be auctioned
        await expect(exchange_minter.auction(0, address_zero, 2000)).to.be.reverted;

        // Blacklisted NFT cannot view info TODO: This function is not needed for now
        // await expect(truthBox.getBoxInfoCID(0)).to.be.reverted;

    });

    // Test setting URI functionality
    it("should correctly set token URI-blacklisted cannot view", async function () {
        const {
            minter, admin, dao,truthBox,
            truthNFT, truthBox_minter,truthBox_DAO,
            nft_minter, nft_DAO
        } = await loadFixture(deployTruthBoxFixture);

        // Check initial URI
        expect(await truthNFT.tokenURI(0)).to.equal("ipfs://00_tokenURIfleek.app");

        // Only Admin can set
        await expect(nft_DAO.setNetwork("https://", "truth.app")).to.be.revertedWithCustomError(truthNFT, "NotAdmin");

        // Minter sets URI
        await truthNFT.setNetwork("https://", ".truth.app");
        expect(await truthNFT.tokenURI(0)).to.equal("https://00_tokenURI.truth.app");

        // Add to blacklist--cannot view URI
        await truthBox_DAO.addBoxToBlacklist(0);
        await expect(nft_DAO.tokenURI(0)).to.be.revertedWithCustomError(truthNFT, "InBlacklist");

    });

    // Add logoCID setting here
    // Test setting logoCID functionality
    // it("should correctly set and query logoCID", async function () {
    //     const {
    //         minter, admin, dao,
    //         truthNFT, truthBox_minter,
    //         nft_minter, nft_DAO, 
    //     } = await loadFixture(deployTruthBoxFixture);

    //     // First set network and suffix to test complete URI
    //     await truthNFT.setNetwork("https://", ".truth.app");

    //     // Non-admin cannot set logoCID
    //     await expect(nft_minter.setLogoCID("new_logo_cid")).to.be.revertedWithCustomError(truthNFT, "NotAdmin");
    //     await expect(nft_DAO.setLogoCID("new_logo_cid")).to.be.revertedWithCustomError(truthNFT, "NotAdmin");

    //     // Admin can set logoCID
    //     await truthNFT.setLogoCID("test_logo_cid");

    //     // Verify logoURI returns correct complete URI
    //     expect(await truthNFT.logoURI()).to.equal("https://test_logo_cid.truth.app");

    //     // Update logoCID and verify again
    //     await truthNFT.setLogoCID("updated_logo_cid");
    //     expect(await truthNFT.logoURI()).to.equal("https://updated_logo_cid.truth.app");
    // });

    

    // Test totalSupply and multiple mints
    it("should correctly track NFT totalSupply", async function () {
        const {
            minter, buyer, admin, dao,truthBox,bytes_mint,
            truthNFT, truthBox_minter, truthBox_buyer
        } = await loadFixture(deployTruthBoxFixture);

        // Initial supply should be 0
        expect(await truthNFT.totalSupply()).to.equal(6);

        // Mint multiple NFTs
        await truthBox_minter.create(minter.address, "test_tokenURI_1", "test_infoURI_1", bytes_mint, 1000);
        expect(await truthNFT.totalSupply()).to.equal(7);

        await truthBox_minter.create(minter.address, "test_tokenURI_2", "test_infoURI_2", bytes_mint, 2000);
        expect(await truthNFT.totalSupply()).to.equal(8);

        await truthBox_minter.create(minter.address, "test_tokenURI_3", "test_infoURI_3", bytes_mint, 3000);
        expect(await truthNFT.totalSupply()).to.equal(9);

    });

    // Test minting truthBox to others, whether others can transfer truthNFT
    it("when minting NFT to others, recipient should be able to transfer NFT", async function () {
        const {
            minter, buyer, admin, other, other2,truthBox,bytes_mint,nft_minter,
            truthNFT, truthBox_minter, nft_other, exchange_minter, exchange_buyer,
            address_zero,
        } = await loadFixture(deployTruthBoxFixture);

        // Mint NFT to other user
        await truthBox_minter.create(other.address, "test_recipient_tokenURI", "test_recipient_infoURI", bytes_mint, 1000);
        const newId = Number(await truthNFT.totalSupply()) - 1;
        
        // Verify owner is other
        expect(await truthNFT.ownerOf(newId)).to.equal(other.address);

        // Complete transaction
        await exchange_minter.sell(newId, address_zero, 2000);
        await exchange_buyer.buy(newId);
        await exchange_buyer.completeOrder(newId);
        
        // minter cannot transfer NFT
        await expect(nft_minter.transferFrom(other.address, buyer.address, newId)).to.be.reverted;
        // other user should be able to transfer NFT to other2
        await nft_other.transferFrom(other.address, other2.address, newId);

        // Verify transfer successful
        expect(await truthNFT.ownerOf(newId)).to.equal(other2.address);
        
    });
    
});





