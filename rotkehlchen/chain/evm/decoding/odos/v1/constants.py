from typing import Final

CPT_ODOS_V1: Final = 'odos-v1'
SWAPPED_EVENT_ABI: Final = '{"anonymous": false,"inputs": [{"indexed": false,"internalType": "address","name": "sender","type": "address"},{"indexed": false,"internalType": "uint256[]","name": "amountsIn","type": "uint256[]"},{"indexed": false,"internalType": "address[]","name": "tokensIn","type": "address[]"},{"indexed": false,"internalType": "uint256[]","name": "amountsOut","type": "uint256[]"},{"components": [{"internalType": "address","name": "tokenAddress","type": "address"},{"internalType": "uint256","name": "relativeValue","type": "uint256"},{"internalType": "address","name": "receiver","type": "address"}],"indexed": false,"internalType": "struct OdosRouter.outputToken[]","name": "outputs","type": "tuple[]"},{"indexed": false,"internalType": "uint256","name": "valueOutQuote","type": "uint256"}],"name": "Swapped","type": "event"}'  # noqa: E501
