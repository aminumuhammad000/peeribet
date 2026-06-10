import axios from 'axios';
import crypto from 'crypto';

const VTSTACK_BASE = 'https://api.vtstack.com.ng/api';
const API_KEY = process.env.VTSTACK_API_KEY || '';

// ─── Create Virtual Account ──────────────────────────────────────────────────
export const createVirtualAccount = async (payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bvn: string;
  reference: string;
}) => {
  const { data } = await axios.post(`${VTSTACK_BASE}/virtual-accounts`, payload, {
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
  });
  return data;
};

// ─── Get Virtual Account by Reference ───────────────────────────────────────
export const getVirtualAccounts = async () => {
  const { data } = await axios.get(`${VTSTACK_BASE}/virtual-accounts`, {
    headers: { 'x-api-key': API_KEY },
  });
  return data;
};

// ─── List Supported Banks ───────────────────────────────────────────────────
export const getBanks = async () => {
  const { data } = await axios.get(`${VTSTACK_BASE}/banks`, {
    headers: { 'x-api-key': API_KEY },
  });
  return data;
};

// ─── Verify Bank Account (Name Enquiry) ──────────────────────────────────────
export const verifyBankAccount = async (bankCode: string, accountNumber: string) => {
  const { data } = await axios.get(`${VTSTACK_BASE}/banks/verify`, {
    params: { bankCode, accountNumber },
    headers: { 'x-api-key': API_KEY },
  });
  return data;
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
  const endpoint = `${VTSTACK_BASE}/v1/payout/secure/request`;
  const timestamp = Date.now().toString();
  const idempotencyKey = crypto.randomBytes(16).toString('hex');
  const bodyString = JSON.stringify(payload);

  // Generate HMAC-SHA256 signature: hash(timestamp + body)
  const signature = crypto.createHmac('sha256', PAYOUT_KEY)
    .update(timestamp + bodyString)
    .digest('hex');

  const { data } = await axios.post(endpoint, payload, {
    headers: {
      'Authorization': `Bearer ${PAYOUT_KEY}`,
      'x-signature': signature,
      'x-timestamp': timestamp,
      'x-idempotency-key': idempotencyKey,
      'Content-Type': 'application/json'
    }
  });
  return data;
};

// ─── Verify Webhook Signature ────────────────────────────────────────────────
export const verifyWebhookSignature = (rawBody: string, signature: string): boolean => {
  const secret = process.env.VTSTACK_WEBHOOK_SECRET || '';
  if (!secret) return true; // Skip if not configured yet
  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return computed === signature;
};
