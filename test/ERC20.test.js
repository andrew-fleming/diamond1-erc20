/* global describe it before ethers */

const {
    getSelectors,
    FacetCutAction
  } = require('../scripts/libraries/diamond.js')
  
  const { deployDiamond } = require('../scripts/deployDiamond.ts')
  
  const { expect } = require('chai')
  
  describe('DiamondTest', async function () {
    let diamondAddress
    let diamondCutFacet
    let diamondLoupeFacet
    let ownershipFacet
    let tx
    let receipt
    const addresses = []

    let owner
    let alice
    let tokenFacet
    let token
  
    before(async function () {
        [owner, alice] = await ethers.getSigners();
        diamondAddress = await deployDiamond()
        diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
        diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
        ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress)
       
        const TokenFacet = await ethers.getContractFactory('TokenFacet')
        tokenFacet = await TokenFacet.deploy()
        await tokenFacet.deployed()
        addresses.push(tokenFacet.address)
        let selectors = getSelectors(tokenFacet)
        tx = await diamondCutFacet.diamondCut(
            [{
                facetAddress: tokenFacet.address,
                action: FacetCutAction.Add,
                functionSelectors: selectors
            }],
            ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
        receipt = await tx.wait()
        if (!receipt.status) {
            throw Error(`Diamond upgrade failed: ${tx.hash}`)
        }

        token = await ethers.getContractAt("TokenFacet", diamondAddress);
    })

    describe("Init", async() => {
        it("should set state vars", async() => {
            expect(await token.name())
                .to.eq("Token")
            
            expect(await token.symbol())
                .to.eq("TOKEN")

            expect(await token.decimals())
                .to.eq(18)
        })
    })

    describe("Check functionality", async() => {
        it("should mint tokens and update balances and totalSupply", async() => {
            let amount = ethers.utils.parseEther("100")
            await Promise.all([
                token.mint(owner.address, amount),
                token.mint(alice.address, amount)
            ])
            expect(await token.balanceOf(owner.address))
                .to.eq(amount)

            expect(await token.balanceOf(alice.address))
                .to.eq(amount)

            expect(await token.totalSupply())
                .to.eq(ethers.utils.parseEther("200"))
        })

        it("should transfer tokens", async() => {
            amount = ethers.utils.parseEther("5")
            await token.connect(alice).approve(alice.address, amount)
            await token.connect(alice).transfer(owner.address, amount)
            
            expect(await token.balanceOf(owner.address))
                .to.eq(ethers.utils.parseEther("105"))

            expect(await token.balanceOf(alice.address))
                .to.eq(ethers.utils.parseEther("95"))
        })
    })
})