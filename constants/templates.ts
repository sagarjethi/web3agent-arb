export const templates = [
    'Swap 100 USDC to USDT.',
    'Swap 100 USDT to ETH and create portfolio with 0.001 WETH and trigger stop loss on -5% and take profit on 10%.',
    'Create portfolio with 0.1 WETH and trigger stop loss on -5% and take profit on 10%.',
    'Deposit 5 USDT to Aave. Borrow 1 USDC from Aave. Repay 1 USDC to Aave. Withdraw 5 USDT from Aave. Swap 5 USDT to ETH.',
    'Swap 250 USDT to LINK. Create portfolio with 0.01 WBTC and set stop loss on -5% and take profit on 10%.',
    'Swap 0.0001 ETH to WBTC. Deposit 0.001 WBTC to Aave. Borrow 10 USDT.',
    'Deposit 0.1 ETH to Lido. Send 0.1 WETH to 0x000000'
];

export const PROMPT_COMMANDS = [
    {
        action: 'MY_BALANCE',
        message: 'Show my detailed account balance.'
    },
    {
        action: 'MY_NFT',
        message: 'Show my NFTs balance.'
    },
    {
        action: 'TOKENS_BY_SYMBOL',
        message: 'Show me the list of tokens in all networks with the search symbol __SYMBOL__',
        note: 'Show me the list of tokens in all networks with the search symbol usdc',
    },
    {
        action: 'TOP_NFT_HOLDER',
        message: 'Show me top NFT holders where the chain name is __CHAIN_NAME__ and the contract address is __CONTRACT_ADDRESS__',
        note: `Supported chain name are mainnet,optimism and arbitrum. Eg: Show me top NFT holders where the chain name is mainnet and the contract address is 0xb7f7f6c52f2e2fdb1963eab30438024864c313f6`
    },
    {
        action: 'TXN_INFO',
        message: 'Show me transaction details where the chain name is __CHAIN_NAME__ and the transaction hash is __TXN_HASH__',
        note: `Supported chain name are mainnet,optimism and arbitrum. Eg: Show me transaction details where the chain name is mainnet and the transaction hash is 0x48cd7f0228f198efa9792274269173d1bba7165b0e7354a06839e6bbee8ed7cb`
    },
    {
        action: 'NFT_METADATA',
        message: 'Show me NFT metadata details where the chain name is __CHAIN_NAME__, the token id is __TOKEN_ID__ and the contract address is __CONTRACT_ADDRESS__',
        note: `Supported chain name are mainnet,optimism and arbitrum. Eg: Show me NFT metadata details where the chain name is mainnet, the token id is 3366 and the contract address is 0x8bc9224253e37cd221c7f510acc42cb6e734db57`
    }
];
