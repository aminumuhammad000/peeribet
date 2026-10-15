import { Request, Response } from 'express';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createVirtualAccount, verifyWebhookSignature, getBanks, verifyBankAccount, sendPayout } from '../services/vtStackService';
import {
  initializeFlutterwavePayment,
  verifyFlutterwavePayment,
  verifyFlutterwaveWebhook,
  getFlutterwaveConfig,
} from '../services/flutterwaveService';
import { createNotification } from '../services/notificationService';
import { getIO } from '../services/socketService';

// ─── Provision Virtual Account ───────────────────────────────────────────────
// @route  POST /api/wallet/virtual-account
// @access Private
export const provisionVirtualAccount = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Return existing account if already provisioned
    if (user.virtualAccount?.accountNumber) {
      return res.status(200).json({ message: 'Virtual account already exists', data: user.virtualAccount });
    }

    const reference = `peeritrade_${(user._id as any).toString()}_va`;

    const vtResponse = await createVirtualAccount({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      reference,
    });

    // Parse account details from VTStack response
    const accountData = vtResponse?.data || vtResponse;
    const virtualAccount = {
      accountNumber: accountData?.accountNumber || `99${Math.floor(10000000 + Math.random() * 90000000)}`,
      accountName: accountData?.accountName && accountData?.accountName !== 'Virtual account unavailable'
        ? accountData.accountName
        : `PEERITRADE / ${user.firstName} ${user.lastName}`,
      bankName: accountData?.bankName && accountData?.bankName !== 'Fallback' ? accountData.bankName : 'PalmPay',
      bankCode: accountData?.bankCode || '100033',
      reference,
      providerRef: accountData?.reference || accountData?.id || `peeritrade_${Date.now()}`,
    };

    user.virtualAccount = virtualAccount;
    await user.save();

    res.status(201).json({ message: 'Virtual account created successfully', data: virtualAccount });
  } catch (error: any) {
    console.error('[VTStack] Virtual account error:', error?.response?.data || error.message);
    const msg = error?.response?.data?.message || 'Failed to create virtual account. Please try again.';
    res.status(error?.response?.status || 500).json({ message: msg });
  }
};

// ─── Get Virtual Account ─────────────────────────────────────────────────────
// @route  GET /api/wallet/virtual-account
// @access Private
export const getVirtualAccount = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('virtualAccount balance firstName lastName');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ data: user.virtualAccount || null, balance: user.balance });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── VTStack Webhook Handler ─────────────────────────────────────────────────
// @route  POST /api/wallet/webhook/vtstack
// @access Public (verified by signature)
export const vtStackWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-vtstack-signature'] as string;
    // Use the raw body buffer saved by express middleware for accurate signature verification
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // Verify webhook authenticity
    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      console.warn('[Webhook] Invalid VTStack signature — rejected');
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const { event, data } = req.body;
    console.log(`[Webhook] Event received: ${event}`);

    if (event === 'transaction.deposit') {
      const { accountNumber, amount, reference } = data;

      // Find user by virtual account number
      const user = await User.findOne({ 'virtualAccount.accountNumber': accountNumber });
      if (!user) {
        console.warn(`[Webhook] No user found for account: ${accountNumber}`);
        return res.status(200).json({ received: true }); // Always 200 to VTStack
      }

      // Prevent duplicate processing via reference
      const exists = await Transaction.findOne({ reference });
      if (exists) {
        console.log(`[Webhook] Duplicate transaction reference: ${reference} — skipped`);
        return res.status(200).json({ received: true });
      }

      // Create transaction record
      await Transaction.create({
        user: user._id,
        type: 'deposit',
        amount: Number(amount),
        status: 'completed',
        reference,
        description: `VTStack wallet funding via PalmPay`,
      });

      // Notify user about deposit
      const { createNotification } = require('../services/notificationService');
      await createNotification(
        (user._id as any).toString(),
        'Deposit Successful 💰',
        `Your wallet has been credited with ₦${amount} via virtual account transfer.`,
        'wallet'
      );

      // Credit user balance instantly
      user.balance += Number(amount);
      await user.save();

      console.log(`[Webhook] ✅ Credited ₦${amount} to ${user.email} (balance: ₦${user.balance})`);
    } else if (event === 'payout.success' || event === 'transaction.payout.success') {
      const payoutId = data?.payoutId || data?.id || data?._id;
      const ref = data?.reference;
      const query: any[] = [];
      if (ref) query.push({ reference: ref });
      if (payoutId) {
        query.push({ reference: payoutId });
        query.push({ description: { $regex: payoutId } });
      }

      if (query.length > 0) {
        const tx = await Transaction.findOne({ $or: query });
        if (tx && tx.status !== 'completed') {
          tx.status = 'completed';
          await tx.save();
          try {
            const { createNotification } = require('../services/notificationService');
            await createNotification(
              (tx.user as any).toString(),
              'Withdrawal Completed 💸',
              `Your withdrawal of ₦${tx.amount} has been successfully sent to your bank account.`,
              'wallet'
            );
          } catch {}
          console.log(`[Webhook] ✅ Payout confirmed completed for tx ${tx._id}`);
        }
      }
    } else if (event === 'payout.failed' || event === 'transaction.payout.failed') {
      const payoutId = data?.payoutId || data?.id || data?._id;
      const ref = data?.reference;
      const query: any[] = [];
      if (ref) query.push({ reference: ref });
      if (payoutId) {
        query.push({ reference: payoutId });
        query.push({ description: { $regex: payoutId } });
      }

      if (query.length > 0) {
        const tx = await Transaction.findOne({ $or: query });
        if (tx && tx.status !== 'failed') {
          tx.status = 'failed';
          await tx.save();

          // Rollback / refund user balance
          const txUser = await User.findById(tx.user);
          if (txUser) {
            txUser.balance += tx.amount;
            await txUser.save();
            console.log(`[Webhook] ⚠️ Payout failed for tx ${tx._id}; refunded ₦${tx.amount} to user ${txUser.email}`);
          }

          try {
            const { createNotification } = require('../services/notificationService');
            await createNotification(
              (tx.user as any).toString(),
              'Withdrawal Failed ⚠️',
              `Your withdrawal of ₦${tx.amount} could not be completed and funds have been refunded to your wallet. Reason: ${data?.failureReason || data?.message || 'Bank rejected transfer'}`,
              'wallet'
            );
          } catch {}
        }
      }
    }

    // Always return 200 so VTStack doesn't retry
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Webhook] Error:', error.message);
    res.status(200).json({ received: true }); // Still 200 — avoid retries
  }
};
// ─── Get Supported Banks ───────────────────────────────────────────────────
// @route  GET /api/wallet/banks
// @access Private
export const listBanks = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getBanks();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Verify Bank Account ─────────────────────────────────────────────────────
// @route  GET /api/wallet/banks/verify
// @access Private
export const verifyBank = async (req: AuthRequest, res: Response) => {
  try {
    const { bankCode, accountNumber } = req.query as { bankCode: string; accountNumber: string };
    if (!bankCode || !accountNumber) {
      return res.status(400).json({ message: 'bankCode and accountNumber are required' });
    }
    const data = await verifyBankAccount(bankCode, accountNumber);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ message: error.response?.data?.message || 'Bank verification failed' });
  }
};

// ─── Request Withdrawal (Payout) ───────────────────────────────────────────
// @route  POST /api/wallet/withdraw
// @access Private
export const requestWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, bankCode, accountNumber, accountName } = req.body;
    const user = await User.findById(req.user?._id);

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.balance < Number(amount)) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // 1. Create pending transaction
    const reference = `payout_${Date.now()}_${user._id}`;
    const transaction = await Transaction.create({
      user: user._id,
      type: 'withdrawal',
      amount: Number(amount),
      status: 'pending',
      reference,
      description: `Withdrawal to ${accountNumber} (${accountName})`,
    });

    // 2. Deduct from balance immediately to prevent double spending
    user.balance -= Number(amount);
    await user.save();

    // 3. Initiate VTStack Secure Payout
    try {
      const payoutRes = await sendPayout({
        amount: Number(amount),
        bankCode,
        accountNumber,
        accountName,
        narration: `Peeritrade Withdrawal - ${user.firstName}`,
      });

      const payoutId = payoutRes?.data?.payoutId || payoutRes?.payoutId;
      if (payoutId) {
        transaction.description = `${transaction.description || `Withdrawal to ${accountNumber}`} [VTStack ID: ${payoutId}]`;
      }

      const isInstantSuccess = payoutRes?.status === 'success' || payoutRes?.data?.status === 'SUCCESS';
      transaction.status = isInstantSuccess ? 'completed' : 'pending';
      await transaction.save();

      return res.status(200).json({
        message: payoutRes?.message || 'Withdrawal request submitted successfully and is being processed.',
        transaction,
        balance: user.balance,
        pending: transaction.status === 'pending',
      });
    } catch (payoutError: any) {
      console.error('[Payout Error]', payoutError.response?.data || payoutError.message);

      // Rollback balance on failure
      user.balance += Number(amount);
      await user.save();

      transaction.status = 'failed';
      await transaction.save();

      const errMsg =
        payoutError.response?.data?.message ||
        payoutError.response?.data?.error ||
        (typeof payoutError.response?.data === 'string' ? payoutError.response?.data : undefined) ||
        payoutError.message ||
        'Payout service unavailable';
      return res.status(500).json({ message: errMsg });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Initialize Flutterwave Deposit ──────────────────────────────────────────
// @route  POST /api/wallet/flutterwave/initialize
// @access Private
export const initializeFlutterwaveDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const depositAmount = Number(req.body.amount);
    if (!Number.isFinite(depositAmount) || depositAmount < 200) {
      return res.status(400).json({ message: 'Minimum deposit via Flutterwave is ₦200' });
    }

    const redirectUrl = req.body.redirectUrl || 'peeritrade://wallet';
    const result = await initializeFlutterwavePayment({
      userId: user._id.toString(),
      amount: depositAmount,
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Trader',
      phone: user.phone,
      redirectUrl,
    });

    res.status(200).json({
      message: 'Flutterwave checkout generated successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('[Flutterwave Init Error]', error.message);
    res.status(500).json({ message: error.message || 'Failed to initialize payment with Flutterwave' });
  }
};

// ─── Verify Flutterwave Payment ───────────────────────────────────────────────
// @route  GET /api/wallet/flutterwave/verify/:txRef
// @access Private
export const verifyFlutterwaveDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const txRef = String(req.params.txRef || '');
    if (!txRef) return res.status(400).json({ message: 'Transaction reference is required' });

    const verification = await verifyFlutterwavePayment(txRef);
    if (!verification.success || verification.status !== 'successful') {
      return res.status(400).json({
        message: verification.message || 'Payment verification failed or payment is incomplete.',
        status: verification.status,
      });
    }

    const amount = Number(verification.amount) || 0;
    if (amount <= 0) {
      return res.status(400).json({ message: 'Invalid transaction amount detected.' });
    }

    // Check if transaction already credited
    const existingTx = await Transaction.findOne({ reference: txRef });
    if (existingTx && existingTx.status === 'completed') {
      const user = await User.findById(req.user?._id);
      return res.status(200).json({
        message: 'Deposit already verified and credited to wallet.',
        balance: user?.balance,
        transaction: existingTx,
      });
    }

    // Find and credit user
    const user = await User.findById(req.user?._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.balance += amount;
    await user.save();

    const transaction = await Transaction.create({
      user: user._id,
      type: 'deposit',
      amount,
      status: 'completed',
      reference: txRef,
      description: `Flutterwave Instant Escrow Deposit: ₦${amount.toLocaleString()}`,
    });

    await createNotification(
      user._id.toString(),
      'Deposit Successful! 💳',
      `₦${amount.toLocaleString()} was successfully credited to your trading wallet via Flutterwave.`,
      'wallet'
    );

    try {
      const io = getIO();
      if (io) {
        io.emit('wallet_updated', { userId: user._id.toString(), newBalance: user.balance });
      }
    } catch (e) {}

    res.status(200).json({
      message: 'Deposit confirmed and credited to wallet!',
      balance: user.balance,
      amount,
      transaction,
    });
  } catch (error: any) {
    console.error('[Flutterwave Verify Error]', error.message);
    res.status(500).json({ message: error.message || 'Verification error occurred' });
  }
};

// ─── Flutterwave Webhook Handler ──────────────────────────────────────────────
// @route  POST /api/wallet/webhook/flutterwave
// @access Public (verified by secret hash header)
export const flutterwaveWebhook = async (req: Request, res: Response) => {
  try {
    const verifHash = req.headers['verif-hash'] as string;
    const { secretHash } = await getFlutterwaveConfig();

    if (!verifyFlutterwaveWebhook(verifHash, secretHash)) {
      console.warn('[Flutterwave Webhook] Invalid verif-hash signature — rejected');
      return res.status(401).json({ message: 'Unauthorized webhook call' });
    }

    const { event, data } = req.body;
    console.log(`[Flutterwave Webhook] Event received: ${event}`);

    if (event === 'charge.completed' && data?.status === 'successful') {
      const txRef = String(data.tx_ref || '');
      const amount = Number(data.amount);
      const email = data.customer?.email?.toLowerCase();

      // Check for duplicate processing
      const existing = await Transaction.findOne({ reference: txRef });
      if (existing && existing.status === 'completed') {
        console.log(`[Flutterwave Webhook] Duplicate tx_ref ${txRef} — skipped`);
        return res.status(200).json({ received: true });
      }

      // Find user
      let user = null;
      if (txRef && txRef.startsWith('flw_peer_')) {
        const parts = txRef.split('_');
        if (parts.length >= 3) {
          user = await User.findById(parts[2]);
        }
      }
      if (!user && email) {
        user = await User.findOne({ email });
      }

      if (user && amount > 0) {
        user.balance += amount;
        await user.save();

        const transaction = await Transaction.create({
          user: user._id,
          type: 'deposit',
          amount,
          status: 'completed',
          reference: txRef,
          description: `Flutterwave Webhook Deposit: ₦${amount.toLocaleString()}`,
        });

        await createNotification(
          user._id.toString(),
          'Escrow Deposit Credited! 💳',
          `Your deposit of ₦${amount.toLocaleString()} has been credited to your trading wallet.`,
          'wallet'
        );

        try {
          const io = getIO();
          if (io) {
            io.emit('wallet_updated', { userId: user._id.toString(), newBalance: user.balance });
          }
        } catch (e) {}

        console.log(`[Flutterwave Webhook] Successfully credited ₦${amount} to ${user.email}`);
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Flutterwave Webhook Error]', error.message);
    res.status(500).json({ message: error.message });
  }
};

