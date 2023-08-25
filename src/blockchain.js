const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction{ 
    // Transaction Constructor includes the amount to be given, address of the person who gives and who receives the coins 
    constructor(fromAddress, toAddress, amount){
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
    }
    calculateHash(){
        // Function to calculates hash with SHA256 with the To address and From address and amount of each transaction
        return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
    }

    signTransaction(signingKey){ 
        /* keyGenerator object signs hash from transaction since you can only give coins with wallet
        that matches your key */
        if(signingKey.getPublic('hex') !== this.fromAddress){  // fromAddress must equal getPublic in hex format
            throw new Error('You cannot sign transactions for other wallets');
        }
        const hashTx = this.calculateHash(); // Creates Hash
        const sig = signingKey.sign(hashTx, 'base64'); // Signs the hash in base64
        this.signature = sig.toDER('hex'); // Store signature in transaction object
    }
    isValid(){
        if (this.fromAddress === null) return true; /* In case of miner reward, since it doesnt come from any address, 
        we assume its a miner*/

        if (!this.signature || this.signature.length === 0){ // Transaction is not valid because it does not contain a signature
            throw new Error("No signature in this transaction!");
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature); 
    }
}
class Block{ // Class to create all block instances
    constructor(timestamp, transactions, previousHash = ''){ 
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }
    
    calculateHash(){ // Uses SHA library to calculate the hash of all the blocks atributes
        return SHA256(this.previousHash + this.timestamp + this.nonce).toString();
    }
    
        mineBlock(difficulty){ // Proof of Work: Function to try nonces until a hash with the required amount of zeroes (difficulty) is found
            while(this.hash.substring(0, difficulty) !== Array(difficulty +1).join("0")){
                this.nonce++;
                this.hash = this.calculateHash();
            }
            console.log("Block mined! " + this.hash);
    }

    hasValidTransactions(){
        for(const tx of this.transactions){
            if(!tx.isValid()){
                return false;
            }
        }
        return true;
    }
}

class Blockchain{ // Array of Blocks, Blockchain
    constructor(){
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    createGenesisBlock(){ // Creates first block of the chain
        return new Block('01/01/2023', 'Genesis Block', '0');
    }
    getLatestBlock(){ // Returns the las added block in the chain
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress){
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);
        
        let block  = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        console.log("Block mined, reward: 100 coins!");
        this.chain.push(block);

        this.pendingTransactions =[];
    }

    addTransaction(transaction){
        if(!transaction.fromAddress || !transaction.toAddress){
            throw new Error("Transaction must have from and to address");
        }
        if(!transaction.isValid()){
            throw new Error('Transaction is invalid, can not add it to the chain');
        }
        this.pendingTransactions.push(transaction);
    }

    getBalanceOfAddress(address){
        let balance = 0;   

        for(const block of this.chain){
            for(const trans of block.transactions){
                if(trans.fromAddress === address){
                    balance -= trans.amount;
                }
                if(trans.toAddress === address){
                    balance += trans.amount;
                }
            }
        }
        return balance;
    }
    isChainValid(){
        for(let i = 1; i < this.chain.length; i++){
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i-1];

            if (!currentBlock.hasValidTransactions()){
                return false;
            }
            if(currentBlock.hash !== currentBlock.calculateHash()){
                return false;
            }

            if(currentBlock.previousHash !== previousBlock.hash){
                return false;
            }
        }

        return true;
    }
    }

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;