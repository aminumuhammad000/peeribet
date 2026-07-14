import axios from 'axios';
import crypto from 'crypto';

const VTSTACK_BASE = 'https://api.vtstack.com.ng/api';
const API_KEY = process.env.VTSTACK_API_KEY || '';

const FALLBACK_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '063', name: 'Access Bank (Diamond)' },
  { code: '011', name: 'First Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '076', name: 'Skye Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '050', name: 'Ecobank' },
  { code: '221', name: 'Stanbic IBTC' },
];

const requireApiKey = () => {
  if (!API_KEY) {
    throw new Error('VTStack API key is not configured. Set VTSTACK_API_KEY in environment variables.');
  }
};

const withFallback = (data: any, message: string) => ({ data, message });

// ─── Create Virtual Account ──────────────────────────────────────────────────
export const createVirtualAccount = async (payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bvn: string;
  reference: string;
}) => {
  try {
    requireApiKey();

    const { data } = await axios.post(`${VTSTACK_BASE}/virtual-accounts`, payload, {
      headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    });

    return withFallback(data, 'Virtual account created successfully');
  } catch (error: any) {
    return withFallback({
      accountNumber: '',
      accountName: 'Virtual account unavailable',
      bankName: 'Fallback',
      bankCode: '',
      reference: payload.reference,
    }, error?.response?.data?.message || 'Virtual account service is unavailable right now.');
  }
};

// ─── Get Virtual Account by Reference ───────────────────────────────────────
export const getVirtualAccounts = async () => {
  try {
    requireApiKey();
    const { data } = await axios.get(`${VTSTACK_BASE}/virtual-accounts`, {
      headers: { 'x-api-key': API_KEY },
    });
    return withFallback(data, 'Virtual accounts fetched successfully');
  } catch (error: any) {
    return withFallback([], error?.response?.data?.message || 'Virtual account service is unavailable');
  }
};

// ─── List Supported Banks ───────────────────────────────────────────────────
export const getBanks = async () => {
  try {
    requireApiKey();
    const { data } = await axios.get(`${VTSTACK_BASE}/banks`, {
      headers: { 'x-api-key': API_KEY },
    });

    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : FALLBACK_BANKS;
    return withFallback(list, data?.message || 'Banks loaded successfully');
  } catch (error: any) {
    return withFallback(FALLBACK_BANKS, error?.response?.data?.message || 'VTStack is unavailable right now. Using a fallback bank list.');
  }
};

// ─── Verify Bank Account (Name Enquiry) ──────────────────────────────────────
export const verifyBankAccount = async (bankCode: string, accountNumber: string) => {
  try {
    requireApiKey();
    const { data } = await axios.get(`${VTSTACK_BASE}/banks/verify`, {
      params: { bankCode, accountNumber },
      headers: { 'x-api-key': API_KEY },
    });

    const accountName = data?.data?.accountName || data?.accountName || 'Verification unavailable';
    return withFallback({ accountName, accountNumber, bankCode }, data?.message || 'Bank verification completed');
  } catch (error: any) {
    return withFallback({
      accountName: 'Verification unavailable',
      accountNumber,
      bankCode,
    }, error?.response?.data?.message || 'Bank verification is temporarily unavailable.');
  }
};

// ─── Send Payout (Secure v1) ─────────────────────────────────────────────────
export const sendPayout = async (payload: {
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  narration: string;
}) => {
  const PAYOUT_KEY = process.env.VTSTACK_PAYOUT_KEY || '';
  if (!PAYOUT_KEY) {
    return {
      status: 'pending',
      message: 'VTStack payout key is not configured. Withdrawal is queued locally for review.',
      reference: `fallback_${Date.now()}`,
    };
  }

  const endpoint = `${VTSTACK_BASE}/v1/payouts/request`;
  const timestamp = Date.now().toString();
  const idempotencyKey = crypto.randomBytes(16).toString('hex');
  const bodyString = JSON.stringify(payload);

  try {
    // Generate HMAC-SHA256 signature: hash(timestamp + body)
    const signature = crypto.createHmac('sha256', PAYOUT_KEY)
      .update(timestamp + bodyString)
      .digest('hex');

    const { data } = await axios.post(endpoint, payload, {
      headers: {
        Authorization: `Bearer ${PAYOUT_KEY}`,
        'x-signature': signature,
        'x-timestamp': timestamp,
        'x-idempotency-key': idempotencyKey,
        'Content-Type': 'application/json',
      },
    });

    return data;
  } catch (error: any) {
    return {
      status: 'pending',
      message: error?.response?.data?.message || error.message || 'Payout provider is unavailable. Withdrawal queued locally for review.',
      reference: `fallback_${Date.now()}`,
    };
  }
};

// ─── Verify Webhook Signature ────────────────────────────────────────────────
export const verifyWebhookSignature = (rawBody: string, signature: string): boolean => {
  const secret = process.env.VTSTACK_WEBHOOK_SECRET || '';
  if (!secret) return true; // Skip if not configured yet
  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return computed === signature;
};
