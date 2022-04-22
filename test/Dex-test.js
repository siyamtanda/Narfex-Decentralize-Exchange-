const Token = artifacts.require('Token')
const Dex = artifacts.require('Dex')

require('chai')
  .use(require('chai-as-promised'))
  .should()

function tokens(n) {
  return web3.utils.toWei(n, 'ether');
}

contract('Dex', ([deployer, investor]) => {
  let token, narfexdex

  before(async () => {
    token = await Token.new()
    narfexdex = await Dex.new(token.address)
    // Transfer all tokens to NarfexDex (1 million)
    await token.transfer(narfexdex.address, tokens('1000000'))
  })

  describe('Token deployment', async () => {
    it('contract has a name', async () => {
      const name = await token.name()
      assert.equal(name, 'Narfex Token')
    })
  })

  describe('Dex deployment', async () => {
    it('contract has a name', async () => {
      const name = await narfexdex.name()
      assert.equal(name, 'Narfex Decentralize Exchange')
    })

    it('contract has tokens', async () => {
      let balance = await token.balanceOf(narfexdex.address)
      assert.equal(balance.toString(), tokens('1000000'))
    })
  })

  describe('buyTokens()', async () => {
    let result

    before(async () => {
      // Purchase tokens before each example
      result = await narfexdex.buyTokens({ from: investor, value: web3.utils.toWei('1', 'ether')})
    })

    it('Allows user to instantly purchase tokens from Narfex Decentralize Exchange for a fixed price', async () => {
      // Check investor token balance after purchase
      let investorBalance = await token.balanceOf(investor)
      assert.equal(investorBalance.toString(), tokens('100'))

      // Check NarfexDex balance after purchase
      let ethSwapBalance
      ethSwapBalance = await token.balanceOf(narfexdex.address)
      assert.equal(ethSwapBalance.toString(), tokens('999900'))
      ethSwapBalance = await web3.eth.getBalance(narfexdex.address)
      assert.equal(ethSwapBalance.toString(), web3.utils.toWei('1', 'Ether'))

      // Check logs to ensure event was emitted with correct data
      const event = result.logs[0].args
      assert.equal(event.account, investor)
      assert.equal(event.token, token.address)
      assert.equal(event.amount.toString(), tokens('100').toString())
      assert.equal(event.rate.toString(), '100')
    })
  })

  describe('sellTokens()', async () => {
    let result

    before(async () => {
      // Investor must approve tokens before the purchase
      await token.approve(narfexdex.address, tokens('100'), { from: investor })
      // Investor sells tokens
      result = await narfexdex.sellTokens(tokens('100'), { from: investor })
    })

    it('Allows user to instantly sell tokens to Narfex Decentralize Exchange for a fixed price', async () => {
      // Check investor token balance after purchase
      let investorBalance = await token.balanceOf(investor)
      assert.equal(investorBalance.toString(), tokens('0'))

      // Check NarfexDex balance after purchase
      let ethSwapBalance
      ethSwapBalance = await token.balanceOf(narfexdex.address)
      assert.equal(ethSwapBalance.toString(), tokens('1000000'))
      ethSwapBalance = await web3.eth.getBalance(narfexdex.address)
      assert.equal(ethSwapBalance.toString(), web3.utils.toWei('0', 'Ether'))

      // Check logs to ensure event was emitted with correct data
      const event = result.logs[0].args
      assert.equal(event.account, investor)
      assert.equal(event.token, token.address)
      assert.equal(event.amount.toString(), tokens('100').toString())
      assert.equal(event.rate.toString(), '100')

      // FAILURE: investor can't sell more tokens than they have
      await narfexdex.sellTokens(tokens('500'), { from: investor }).should.be.rejected;
    })
  })

})
