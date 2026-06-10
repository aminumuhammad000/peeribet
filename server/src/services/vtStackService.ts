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

// ─── Verify Webhook Signature ────────────────────────────────────────────────
export const verifyWebhookSignature = (rawBody: string, signature: string): boolean => {
  const secret = process.env.VTSTACK_WEBHOOK_SECRET || '';
  if (!secret) return true; // Skip if not configured yet
  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return computed === signature;
};
