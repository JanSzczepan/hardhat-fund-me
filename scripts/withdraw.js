const { getNamedAccounts, ethers } = require("hardhat")

async function main () {
   const { deployer } = await getNamedAccounts()
   const fundMe = await ethers.getContract('FundMe', deployer)

   console.log('Withdrawing...')

   const withdrawTxResponse = await fundMe.withdraw()
   await withdrawTxResponse.wait(1)

   console.log('Got it back!')
}

main()
   .then(() => process.exit(0))
   .catch((error) => {
      console.log(error)
      process.exit(1)
   })