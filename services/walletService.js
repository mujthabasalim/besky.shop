const Wallet = require('../models/Wallet');
const { v4: uuidv4 } = require('uuid');

// Fetch or create the user's wallet
const getWallet = async (userId) => {
  if (!userId) throw new Error("User ID is required.");

  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = new Wallet({ userId, balance: 0, transactions: [] });
    await wallet.save();
  }
  return wallet;
};

// Credit wallet (add funds)
const creditWallet = async (userId, amount, description = 'Credit transaction') => {
  if (!userId || !amount) throw new Error("User ID and amount are required.");

  const wallet = await getWallet(userId);
  const transactionId = uuidv4();

  // Create the credit transaction
  wallet.transactions.push({
    transactionId,
    type: 'credit',
    amount,
    description,
    createdAt: new Date(),
  });

  // Update the wallet balance
  wallet.balance += amount;
  await wallet.save();

  return { success: true, transactionId, balance: wallet.balance };
};

// Debit wallet (deduct funds)
const debitWallet = async (userId, amount, description = 'Debit transaction') => {
  if (!userId || !amount) throw new Error("User ID and amount are required.");

  const wallet = await getWallet(userId);

  // Check if the wallet has enough balance
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance in wallet.');
  }

  const transactionId = uuidv4();

  // Create the debit transaction
  wallet.transactions.push({
    transactionId,
    type: 'debit',
    amount,
    description,
    createdAt: new Date(),
  });

  // Deduct the wallet balance
  wallet.balance -= amount;
  await wallet.save();

  return { success: true, transactionId, balance: wallet.balance };
};

// Verify if a transaction exists (idempotency check)
const verifyTransaction = async (transactionId) => {
  if (!transactionId) throw new Error("Transaction ID is required.");

  const transaction = await Wallet.findOne({
    'transactions.transactionId': transactionId,
  });
  return transaction !== null;
};

// Helper function to get wallet balance
const getBalance = async (userId) => {
  if (!userId) throw new Error("User ID is required.");

  const wallet = await getWallet(userId);
  return wallet.balance;
};

// Get transaction history for the user
const getTransactionHistory = async (userId) => {
  if (!userId) throw new Error("User ID is required.");

  const wallet = await getWallet(userId);
  return wallet.transactions;
};

module.exports = {
  getWallet,
  creditWallet,
  debitWallet,
  verifyTransaction,
  getBalance,
  getTransactionHistory,
};
