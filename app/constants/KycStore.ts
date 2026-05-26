import { useState, useEffect } from 'react';

export type KycStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface KycData {
  fullName: string;
  dob: string;
  nationality: string;
  idType: string;
  idNumber: string;
  documentName?: string;
  selfieName?: string;
  rejectionReason?: string;
}

let currentStatus: KycStatus = 'UNVERIFIED';
let currentData: KycData | null = null;
const listeners = new Set<() => void>();

export const KycStore = {
  getStatus() {
    return currentStatus;
  },
  getData() {
    return currentData;
  },
  submitKyc(data: KycData) {
    currentStatus = 'PENDING';
    currentData = data;
    this.notify();
  },
  approveKyc() {
    currentStatus = 'VERIFIED';
    if (currentData) {
      currentData.rejectionReason = undefined;
    }
    this.notify();
  },
  rejectKyc(reason: string) {
    currentStatus = 'REJECTED';
    if (currentData) {
      currentData.rejectionReason = reason;
    }
    this.notify();
  },
  resetKyc() {
    currentStatus = 'UNVERIFIED';
    currentData = null;
    this.notify();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  notify() {
    listeners.forEach((l) => l());
  },
};

export function useKyc() {
  const [status, setStatus] = useState<KycStatus>(KycStore.getStatus());
  const [data, setData] = useState<KycData | null>(KycStore.getData());

  useEffect(() => {
    return KycStore.subscribe(() => {
      setStatus(KycStore.getStatus());
      setData(KycStore.getData());
    });
  }, []);

  return {
    status,
    data,
    submitKyc: (data: KycData) => KycStore.submitKyc(data),
    approveKyc: () => KycStore.approveKyc(),
    rejectKyc: (reason: string) => KycStore.rejectKyc(reason),
    resetKyc: () => KycStore.resetKyc(),
  };
}
