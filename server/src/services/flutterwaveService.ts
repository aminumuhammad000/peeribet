import axios from 'axios';
import SystemSetting from '../models/SystemSetting';

const FLUTTERWAVE_BASE = 'https://api.flutterwave.com/v3';

/**
 * Helper to fetch Flutterwave credentials from SystemSetting DB or process.env
 */
export const getFlutterwaveConfig = async () => {
  let secretKey = process.env.FLW_SECRET_KEY || process.env.FLUTTERWAVE_SECRET_KEY || '';
  let publicKey = process.env.FLW_PUBLIC_KEY || process.env.FLUTTERWAVE_PUBLIC_KEY || '';
  let secretHash = process.env.FLW_SECRET_HASH || process.env.FLUTTERWAVE_SECRET_HASH || 'peeritrade_flw_secret';

  try {
    const settings = await SystemSetting.findOne();
    if (settings) {
      if ((settings as any).flutterwaveSecretKey) {
        secretKey = (settings as any).flutterwaveSecretKey;
      }
      if ((settings as any).flutterwavePublicKey) {
        publicKey = (settings as any).flutterwavePublicKey;
      }
      if ((settings as any).flutterwaveSecretHash) {
        secretHash = (settings as any).flutterwaveSecretHash;
      }
    }
  } catch (e) {
    // Non-blocking fallback
  }

  return { secretKey, publicKey, secretHash };
};

/**
 * Initialize a Flutterwave standard checkout payment
 */
export const initializeFlutterwavePayment = async (payload: {
  userId: string;
  amount: number;
  email: string;
  name: string;
  phone?: string;
  redirectUrl?: string;
}) => {
  const { secretKey, publicKey } = await getFlutterwaveConfig();
  const txRef = `flw_peer_${payload.userId}_${Date.now()}`;

  // If secret key is not configured or in local sandbox development
  if (!secretKey) {
    console.warn('[Flutterwave] Secret key not configured. Providing sandbox simulation.');
    return {
      success: true,
      link: `https://checkout.flutterwave.com/v3/hosted/pay/sandbox_${txRef}`,
      txRef,
      mode: 'SANDBOX_SIMULATION',
    };
  }

  try {
    const response = await axios.post(
      `${FLUTTERWAVE_BASE}/payments`,
      {
        tx_ref: txRef,
        amount: payload.amount,
        currency: 'NGN',
        redirect_url: payload.redirectUrl || 'peeritrade://wallet',
        customer: {
          email: payload.email,
          phonenumber: payload.phone || '08000000000',
          name: payload.name,
        },
        customizations: {
          title: 'Peeritrade Trading Escrow',
          description: 'Instant Trading Wallet Deposit',
          logo: 'https://peeritrade.ng/logo.png',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data?.status === 'success' && response.data?.data?.link) {
      return {
        success: true,
        link: response.data.data.link,
        txRef,
        mode: 'LIVE',
      };
    }

    throw new Error(response.data?.message || 'Failed to generate Flutterwave checkout link');
  } catch (error: any) {
    console.error('[Flutterwave] Initialization error:', error.response?.data || error.message);
    const msg = error.response?.data?.message || error.message;
    throw new Error(`Flutterwave Payment Error: ${msg}`);
  }
};

/**
 * Verify a Flutterwave payment transaction by transaction reference
 */
export const verifyFlutterwavePayment = async (txRef: string) => {
  const { secretKey } = await getFlutterwaveConfig();

  // If sandbox / simulated ref
  if (txRef.includes('sandbox_') || !secretKey) {
    return {
      success: true,
      status: 'successful',
      amount: 5000,
      currency: 'NGN',
      txRef,
      isSimulated: true,
    };
  }

  try {
    const response = await axios.get(
      `${FLUTTERWAVE_BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const data = response.data?.data;
    if (response.data?.status === 'success' && data && data.status === 'successful') {
      return {
        success: true,
        status: data.status,
        amount: Number(data.amount),
        currency: data.currency,
        txRef: data.tx_ref,
        transactionId: data.id,
        customer: data.customer,
        raw: data,
      };
    }

    return {
      success: false,
      status: data?.status || 'failed',
      message: response.data?.message || 'Payment has not been completed',
    };
  } catch (error: any) {
    console.error('[Flutterwave] Verification error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Payment verification failed');
  }
};

/**
 * Verify Flutterwave webhook signature using secret hash
 */
export const verifyFlutterwaveWebhook = (verifHashHeader: string | undefined, secretHash: string): boolean => {
  if (!verifHashHeader || !secretHash) return false;
  return verifHashHeader === secretHash;
};
