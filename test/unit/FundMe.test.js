const { ethers, deployments, getNamedAccounts, network } = require('hardhat')
const { assert, expect } = require('chai')
const { developmentChains } = require('../../helper-hardhat-config')
// require('hardhat/console.sol')

!developmentChains.includes(network.name) ?
describe.skip :
describe('FundMe', async () => {
   
   let fundMe, deployer, mockV3Aggregator
   const valueSend = ethers.utils.parseEther('1') // 1000000000000000000
   
   beforeEach(async () => {
      // const accounts = await ethers.getSigners()
      // const accountZero = accounts[0]
      deployer = (await getNamedAccounts()).deployer

      await deployments.fixture(["all"])
      fundMe = await ethers.getContract('FundMe', deployer)
      mockV3Aggregator = await ethers.getContract('MockV3Aggregator', deployer)
   })
   
   describe('constructor', async () => {
      it('Sets the aggregator addresses correctly', async () => {
         const response = await fundMe.getPriceFeed()
         assert.equal(response, mockV3Aggregator.address)
      })
   })

   describe('fund', async () => {
      it("Fails if you don't send enough ETH", async () => {
         await expect(fundMe.fund()).to.be.revertedWith("Didn't send enough ETH!")
      })

      it('Updated the amount funded data structure', async () => {
         await fundMe.fund({ value: valueSend })
         const response = await fundMe.getAddressToAmountFunded(deployer)
   
         assert.equal(response.toString(), valueSend.toString())
      })

      it('Adds funder to array of funders', async () => {
         await fundMe.fund({ value: valueSend })
         const response = await fundMe.getFunder(0)

         assert.equal(response, deployer)
      })
   })

   describe('withdraw', async () => {
      beforeEach(async () => {
         await fundMe.fund({ value: valueSend })
      })

      it('Withdraw ETH from single founder', async () => {
         const startingContractBalance = await fundMe.provider.getBalance(fundMe.address)
         const startingFunderBalance = await fundMe.provider.getBalance(deployer)
         
         const transactionResponse = await fundMe.withdraw()
         const transactionReceipt = await transactionResponse.wait(1)

         const { effectiveGasPrice, gasUsed } = transactionReceipt
         const gasCost = effectiveGasPrice.mul(gasUsed)

         const endingContractBalance = await fundMe.provider.getBalance(fundMe.address)
         const endingFunderBalance = await fundMe.provider.getBalance(deployer)

         assert.equal(endingContractBalance, 0)
         assert.equal(startingContractBalance.add(startingFunderBalance).toString(), endingFunderBalance.add(gasCost).toString())
      })

      it('Allows us to withdraw with multiple funders', async () => {
         const accounts = await ethers.getSigners()

         for(let i = 1; i < 6; i++) {
            const connectedFundMe = await fundMe.connect(accounts[i])
            
            await connectedFundMe.fund({ value: valueSend })
         }

         const startingContractBalance = await fundMe.provider.getBalance(fundMe.address)
         const startingFunderBalance = await fundMe.provider.getBalance(deployer)
      
         const transactionResponse = await fundMe.withdraw()
         const transactionReceipt = await transactionResponse.wait(1)

         const { effectiveGasPrice, gasUsed } = transactionReceipt
         const gasCost = effectiveGasPrice.mul(gasUsed)

         const endingContractBalance = await fundMe.provider.getBalance(fundMe.address)
         const endingFunderBalance = await fundMe.provider.getBalance(deployer)

         assert.equal(endingContractBalance, 0)
         assert.equal(startingContractBalance.add(startingFunderBalance).toString(), endingFunderBalance.add(gasCost).toString())
      
         await expect(fundMe.getFunder(0)).to.be.reverted

         for(let i = 1; i < 6; i++) {
            assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0)
         }
      })

      it('Only allows owner to withdraw', async () => {
         const accounts = await ethers.getSigners()
         const attacker = accounts[1]
         const attackerConntectedFundMe = await fundMe.connect(attacker)

         await expect(attackerConntectedFundMe.withdraw()).to.be.revertedWithCustomError(attackerConntectedFundMe, 'FundMe__NotOwner')
      })
   })
})