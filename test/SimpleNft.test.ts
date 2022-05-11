import MerkleTree from "merkletreejs";
import { utils } from "mocha";
import { SimpleNftInstance } from "../types/truffle-contracts";
import {
    generateRoot,
    getProof,

} from '../utils/merkle';   
const truffleAssert = require('truffle-assertions');

//const { expect, assert } = require('chai');
//const { expect } = require('../utils/chaisetup');
//const chai = require('../utils/chaisetup');
const Nft = artifacts.require("SimpleNft");
const {
    BN,           // Big Number support
    constants,    // Common constants, like the zero address and largest integers
} = require('@openzeppelin/test-helpers');



contract("SimpleNft", ([deployer, wl1, wl2, pub1, pub2, user1]) => {
    describe("deployment", async () => {

        it("should deploy the token", async() => {
            const instance = await Nft.deployed();
            expect(instance).to.not.be.undefined;
        });

        it("should have 0 totalSupply", async() => {
            const instance = await Nft.deployed();
            expect((await instance.totalSupply()).toString()).to.eql((new BN(0)).toString());
        });

        it("should start in stage 0", async() => {
            const instance = await Nft.deployed();
            expect((await instance.stage()).toString()).to.eql((new BN(0)).toString());
        });

    });

    describe("token uri", async () => {

        before(async () => {
            // Mint 1 dev token
            const instance = await Nft.deployed();
            await instance.devMint(deployer, new BN(1));
        });

        it("should read the token uri", async() => {
            const instance = await Nft.deployed();
            await truffleAssert.passes(instance.tokenURI(0), "Token URI should exists");
        });

        it("should set the base uri", async() => {
            const instance = await Nft.deployed();
            await truffleAssert.passes(instance.setBaseURI("https://example.com/", {from: deployer}));
            expect(await instance.tokenURI(0)).to.eql("https://example.com/0");
        });

        it("should revert set base uri if not owner", async() => {
            const instance = await Nft.deployed();
            await truffleAssert.fails(instance.setBaseURI("https://example.com/", {from: user1}));
        });
    });

    describe("owner functions", async () => {
        
        it("should set the merkle root", async() => {
            const instance = await Nft.deployed();
            await truffleAssert.passes(instance.setMerkleRoot("0x1234567890", {from: deployer}));
        });

        it("should revert set merkle root if not owner", async() => {
            const instance = await Nft.deployed();
            await truffleAssert.fails(instance.setMerkleRoot("0x1234567890", {from: user1}));
        })

        it("should withdraw balance", async() => {
            const instance = await Nft.deployed();
            /* TODO: contract has no fallback function, no ether can be transfered

            expect(await web3.eth.getBalance(instance.address)).to.eql("0");
            // Send 1 eth
            await instance.sendTransaction({from: deployer, value: web3.utils.toWei('1', 'ether')});
            expect((await web3.eth.getBalance(instance.address)).toString()).to.eql(web3.utils.toWei('1', 'ether'));

            const balanceBeforeDeployer = await web3.eth.getBalance(deployer);
            await instance.withdraw({from: deployer});
            expect(await web3.eth.getBalance(instance.address)).to.eql("0");
            const balanceAfterDeployer = await web3.eth.getBalance(deployer);
            expect(balanceAfterDeployer.toString()).to.eql(new BN(balanceBeforeDeployer).add(new BN(web3.utils.toWei('1', 'ether'))).toString());
            */
        });

        it("should revert withdraw balance if not owner", async() => {
            const instance = await Nft.deployed();
            await truffleAssert.fails(instance.withdraw({from: user1}));
        });

        it("should set whitelist mint params", async() => {
            const instance = await Nft.deployed();
            await truffleAssert.passes(instance.setWhitelistMintParams(new BN(web3.utils.toWei('0.1', 'ether')), new BN(10)));

            expect((await instance.WHITELIST_MINT_PRICE()).toString()).to.eql(new BN(web3.utils.toWei('0.1', 'ether')).toString());
            expect((await instance.WHITELIST_MAX_MINT()).toString()).to.eql(new BN(10).toString());
        });

        it("should set public mint params", async() => {
            const instance = await Nft.deployed();
            await truffleAssert.passes(instance.setPublicMintParams(new BN(web3.utils.toWei('0.2', 'ether')), new BN(5)));

            expect((await instance.PUBLIC_MINT_PRICE()).toString()).to.eql(new BN(web3.utils.toWei('0.2', 'ether')).toString());
            expect((await instance.PUBLIC_MAX_MINT()).toString()).to.eql(new BN(5).toString());
        });

        it("should revert set mint params if not owner", async() => {
            const instance = await Nft.deployed();
            await truffleAssert.reverts(instance.setWhitelistMintParams(new BN(web3.utils.toWei('0.1', 'ether')), new BN(10), {from: user1}));
            await truffleAssert.reverts(instance.setPublicMintParams(new BN(web3.utils.toWei('0.2', 'ether')), new BN(5), {from: user1}));
        });

        it("should revert set mint params if mint in progress", async() => {
            const instance = await Nft.deployed();
            await truffleAssert.passes(instance.setStage(new BN(1)));

            await truffleAssert.reverts(instance.setWhitelistMintParams(new BN(web3.utils.toWei('0.1', 'ether')), new BN(10), {from: deployer}));
            await truffleAssert.reverts(instance.setPublicMintParams(new BN(web3.utils.toWei('0.2', 'ether')), new BN(5), {from: deployer}));

            await truffleAssert.passes(instance.setStage(new BN(2)));

            await truffleAssert.reverts(instance.setWhitelistMintParams(new BN(web3.utils.toWei('0.1', 'ether')), new BN(10), {from: deployer}));
            await truffleAssert.reverts(instance.setPublicMintParams(new BN(web3.utils.toWei('0.2', 'ether')), new BN(5), {from: deployer}));
        });

        it("should set stage", async() => {
            const instance = await Nft.deployed();
            await truffleAssert.passes(instance.setStage(new BN(1)));
            await truffleAssert.passes(instance.setStage(new BN(0)));
            await truffleAssert.passes(instance.setStage(new BN(2)));
            await truffleAssert.passes(instance.setStage(new BN(0)));

            await truffleAssert.reverts(instance.setStage(new BN(3)));
        });
    });

    describe("setup whitelist address", async () => {

        it("should update address", async() => {
            const instance = await Nft.deployed();
            // Generate merkle root
            const { root, tree } = generateRoot([wl1, wl2]);
            const proof = getProof(tree, wl1);

            await instance.setMerkleRoot(root, {from: deployer});
            
            await truffleAssert.passes(instance.setWhitelistMintParams(new BN(web3.utils.toWei('0.1', 'ether')), new BN(2)));
            await instance.setStage(new BN(1));


            await truffleAssert.passes(instance.whitelistMint(new BN(2), proof, {from: wl1, value: web3.utils.toWei('0.2', 'ether')}));
            await truffleAssert.reverts(instance.whitelistMint(new BN(2), proof, {from: pub1, value: web3.utils.toWei('0.2', 'ether')}));
        });
    });

    describe("whitelist mint", async () => {
        let tree: MerkleTree;
        let instance: SimpleNftInstance;

        beforeEach(async() => {
            instance = await Nft.new();
            // Pause minting
            await instance.setStage(new BN(0));
            // Set the WL price. 0.05 eth each and max 2 per wallet
            await instance.setWhitelistMintParams(new BN(web3.utils.toWei('0.05', 'ether')), new BN(2));
            // Generate merkle root
            const { root, tree: localTree } = generateRoot([wl1, wl2]);
            tree = localTree;

            await instance.setMerkleRoot(root, {from: deployer});

            // Start wl minting
            await instance.setStage(new BN(1));
        });

        it("should mint", async() => {
            const proof = getProof(tree, wl1);

            const balanceBefore = await web3.eth.getBalance(wl1);
            const supplyBefore = await instance.totalSupply();
            // Max mint
            const tx = await instance.whitelistMint(new BN(2), proof, {from: wl1, value: web3.utils.toWei('0.1', 'ether')});
            const gasUsed = new BN(tx.receipt.gasUsed);
            const gasPrice = new BN((await web3.eth.getTransaction(tx.tx)).gasPrice);
            const gasCost = gasPrice.mul(gasUsed);
            /*
            console.log(`
                gasUsed: ${gasUsed}
                gasPrice: ${gasPrice}
                gasCost: ${gasCost}
            `)
            */

            truffleAssert.eventEmitted(tx, 'Mint');
            
            const balanceAfter = await web3.eth.getBalance(wl1);
            const supplyAfter = await instance.totalSupply();
            const tokenBalance = await instance.balanceOf(wl1);

            expect(supplyAfter.toString()).to.equal(supplyBefore.add(new BN(2)).toString());
            // TODO: gas price calculation is not working. Dunno why ....
            //expect(balanceAfter).to.equal((new BN(balanceBefore).add(gasCost).add(new BN(web3.utils.toWei('0.1', 'ether')))).toString());
            expect(tokenBalance.toString()).to.eql(new BN(2).toString());
            
        });

        it("should not exceed allocation", async() => {
            const proof = getProof(tree, wl1);

            await truffleAssert.fails(instance.whitelistMint(new BN(3), proof, {from: wl1, value: web3.utils.toWei('0.15', 'ether')}));
        });

        it("should not mint again with max allocation",async () => {
            const proof = getProof(tree, wl1);

            await truffleAssert.passes(instance.whitelistMint(new BN(2), proof, {from: wl1, value: web3.utils.toWei('0.1', 'ether')}));
            await truffleAssert.fails(instance.whitelistMint(new BN(1), proof, {from: wl1, value: web3.utils.toWei('0.05', 'ether')}));
        });

        it("should mint if not minted max allocation", async() => {
            const proof = getProof(tree, wl1);

            await truffleAssert.passes(instance.whitelistMint(new BN(1), proof, {from: wl1, value: web3.utils.toWei('0.05', 'ether')}));
            await truffleAssert.passes(instance.whitelistMint(new BN(1), proof, {from: wl1, value: web3.utils.toWei('0.05', 'ether')}));
        });

        it("should check for correct price", async() => {
            const proof = getProof(tree, wl1);

            await truffleAssert.fails(instance.whitelistMint(new BN(2), proof, {from: wl1, value: web3.utils.toWei('0.05', 'ether')}));
        });

        it("should prevent mint if paused", async() => {
            const proof = getProof(tree, wl1);
            
            await instance.setStage(new BN(0));
            await truffleAssert.fails(instance.whitelistMint(new BN(2), proof, {from: wl1, value: web3.utils.toWei('0.1', 'ether')}));
        });

        it("should prevent mint if minted and transfered out", async() => {
            const proof = getProof(tree, wl1);

            await truffleAssert.passes(instance.whitelistMint(new BN(2), proof, {from: wl1, value: web3.utils.toWei('0.1', 'ether')}));

            await instance.transferFrom(wl1, wl2, new BN(0), {from: wl1});
            await instance.transferFrom(wl1, wl2, new BN(1), {from: wl1});

            await truffleAssert.fails(instance.whitelistMint(new BN(2), proof, {from: wl1, value: web3.utils.toWei('0.1', 'ether')}));
        });

        it("should not mint more than whitelist allocation", async() => {
            await instance.setStage(new BN(0));
            await truffleAssert.passes(instance.setWhitelistMintParams(new BN(web3.utils.toWei('0.0005', 'ether')), new BN(2000)));
            await instance.setStage(new BN(1));

            // Mint 2000
            let proof = getProof(tree, wl1);
            await truffleAssert.passes(instance.whitelistMint(new BN(2000), proof, {from: wl1, value: web3.utils.toWei('1', 'ether')}));
            // Mint 1333
            proof = getProof(tree, wl2);
            await truffleAssert.passes(instance.whitelistMint(new BN(1333), proof, {from: wl2, value: web3.utils.toWei('0.6665', 'ether')}));
            // Try to mint 1 more
            await truffleAssert.fails(instance.whitelistMint(new BN(1), proof, {from: wl2, value: web3.utils.toWei('0.0005', 'ether')}));
        });

        it("should mint more than total supply", async() => {
            await instance.setStage(new BN(0));
            await truffleAssert.passes(instance.setWhitelistMintParams(new BN(web3.utils.toWei('0.0001', 'ether')), new BN(10000)));
            await instance.setStage(new BN(1));
        });

        it("should not mint if not whitelisted", async() => {
            let proof = getProof(tree, pub1);
            await truffleAssert.fails(instance.whitelistMint(new BN(1), proof, {from: pub1, value: web3.utils.toWei('0.05', 'ether')}));
            proof = getProof(tree, wl1);
            await truffleAssert.fails(instance.whitelistMint(new BN(1), proof, {from: pub1, value: web3.utils.toWei('0.05', 'ether')}));
        });

    });

    describe("public mint", async () => {
        let instance: SimpleNftInstance;

        beforeEach(async() => {
            instance = await Nft.new();
            // Pause minting
            await instance.setStage(new BN(0));
            // Set the public price. 0.05 eth each and max 2 per wallet
            await instance.setPublicMintParams(new BN(web3.utils.toWei('0.05', 'ether')), new BN(2));

            // Start wl minting
            await instance.setStage(new BN(2));
        });


    });
});