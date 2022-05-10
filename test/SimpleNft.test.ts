import { utils } from "mocha";
const truffleAssert = require('truffle-assertions');

//const { expect, assert } = require('chai');
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

        it("should revert set whitelist mint params if not owner", async() => {
            const instance = await Nft.deployed();
            await truffleAssert.reverts(instance.setWhitelistMintParams(new BN(web3.utils.toWei('0.1', 'ether')), new BN(10), {from: user1}));
        });

        it("should revert set public mint params if not owner", async() => {
            const instance = await Nft.deployed();
            await truffleAssert.fails(instance.setPublicMintParams(new BN(web3.utils.toWei('0.2', 'ether')), new BN(5), {from: user1}));
        });

        it("should set stage", async() => {
            const instance = await Nft.deployed();
            await truffleAssert.passes(instance.setStage(new BN(1)));
            await truffleAssert.passes(instance.setStage(new BN(0)));
            await truffleAssert.passes(instance.setStage(new BN(2)));
            await truffleAssert.passes(instance.setStage(new BN(0)));

            await truffleAssert.revert(instance.setStage(new BN(3)));
        });
    });

    describe("setup whitelist address", async () => {

    });

    describe("whitelist mint", async () => {

    });

    describe("public mint", async () => {

    });
});