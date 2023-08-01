const {Blockchain, Transaction}  = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('7c2202f947185d1fd1e77a493660d17f3761b1180fb5dde02e46ec096655a143');
const myWalletAddress = myKey.getPublic('hex');

let ultiCoin  = new Blockchain();

const tr1 = new Transaction(myWalletAddress, 'To address public key here', 10);
tr1.signTransaction(myKey);
ultiCoin.addTransaction(tr1);
console.log("\n Miner is cooking...");
ultiCoin.minePendingTransactions(myWalletAddress);

console.log("Alex has a balance of " + ultiCoin.getBalanceOfAddress(myWalletAddress));

console.log('Is blockchain valid? ' + ultiCoin.isChainValid());

