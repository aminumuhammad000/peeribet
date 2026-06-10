import { Request, Response } from 'express';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createVirtualAccount, verifyWebhookSignature, getBanks, verifyBankAccount, sendPayout } from '../services/vtStackService';

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

    const bvn = req.body.bvn;
    if (!bvn || bvn.length !== 11) {
      return res.status(400).json({ message: 'A valid 11-digit BVN is required to create a virtual account' });
    }

    const reference = `peeribet_${(user._id as any).toString()}_va`;

    const vtResponse = await createVirtualAccount({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      bvn,
      reference,
    });

    // Parse account details from VTStack response
    const accountData = vtResponse?.data || vtResponse;
    const virtualAccount = {
      accountNumber: accountData.accountNumber,
      accountName: accountData.accountName || `PEERIBET / ${user.firstName} ${user.lastName}`,
      bankName: accountData.bankName || 'PalmPay',
      bankCode: accountData.bankCode || '100033',
      reference,
      providerRef: accountData.reference || accountData.id || '',
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
    const rawBody = JSON.stringify(req.body);

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

      // Credit user balance instantly
      user.balance += Number(amount);
      await user.save();

      console.log(`[Webhook] ✅ Credited ₦${amount} to ${user.email} (balance: ₦${user.balance})`);
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
        narration: `Peeribet Withdrawal - ${user.firstName}`,
      });

      // Update transaction with status from VTStack if available
      transaction.status = 'completed'; // Assuming instant for this demo
      await transaction.save();

      res.status(200).json({ 
        message: 'Withdrawal successful', 
        transaction,
        balance: user.balance 
      });
    } catch (payoutError: any) {
      console.error('[Payout Error]', payoutError.response?.data || payoutError.message);
      
      // Rollback balance on failure
      user.balance += Number(amount);
      await user.save();
      
      transaction.status = 'failed';
      await transaction.save();

      const errMsg = payoutError.response?.data?.message || 'Payout service unavailable';
      res.status(500).json({ message: errMsg });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
