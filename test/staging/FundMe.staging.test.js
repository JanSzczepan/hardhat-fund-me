const { network, ethers, getNamedAccounts } = require("hardhat")
const { assert } = require("chai")

const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name) ? 
   describe.skip :
   describe('FundMe', async () => {
      let fundMe, deployer
      const valueSend = await ethers.utils.parseEther('0.1')

      beforeEach(async () => {
         deployer = (await getNamedAccounts()).deployer
         fundMe = await ethers.getContract('FundMe', deployer)
      })

      it('Allows people to fund and withdraw', async () => {
         
         const fundTxResponse = await fundMe.fund({ value: valueSend })
         await fundTxResponse.wait(1)
         const withdrawTxResponse = await fundMe.withdraw()
         await withdrawTxResponse.wait(1)

         const endingBalance = await fundMe.provider.getBalance(fundMe.address)

         assert.equal(endingBalance.toString(), "0")
      })
   })