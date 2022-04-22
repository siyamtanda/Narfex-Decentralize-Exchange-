const Token = artifacts.require("Token");
const NarfexDex = artifacts.require("NarfexDex");

module.exports = async function(deployer) {
  // Deploy Token
  await deployer.deploy(Token);
  const token = await Token.deployed()

  // Deploy EthSwap
  await deployer.deploy(NarfexDex, token.address);
  const narfexdex = await NarfexDex.deployed()

  // Transfer all tokens to EthSwap (1 million)
  await token.transfer(narfexdex.address, '1000000000000000000000000')
};
