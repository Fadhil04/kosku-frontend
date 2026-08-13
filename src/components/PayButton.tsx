import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle, ShieldCheck } from 'lucide-react';
import { paymentGatewayApi } from '../api/paymentGateway';
import { loadMidtransSnap } from '../lib/midtransSnap';
import type { PaymentTransaction } from '../types';
import { useToast } from './Toast';

const TERMINAL_STATUSES = new Set<PaymentTransaction['status']>([
  'SETTLEMENT',
  'CAPTURE',
  'DENY',
  'CANCEL',
  'EXPIRE',
  'FAILURE',
  'REFUND',
]);

interface PayButtonProps {
  billId: string;
}

export function PayButton({ billId }: PayButtonProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [trackedTransactionId, setTrackedTransactionId] = useState<string | null>(null);
  const notifiedStatus = useRef<PaymentTransaction['status'] | null>(null);
  const trackingErrorNotified = useRef(false);
  const callbackStatus = useRef<'success' | 'pending' | 'error' | null>(null);
  const queryClient = useQueryClient();
  const { success, info, error: toastError } = useToast();

  const { data: transaction, isError: isTrackingError } = useQuery({
    queryKey: ['payment-transaction', billId, trackedTransactionId],
    queryFn: () => paymentGatewayApi.getTransaction(billId, trackedTransactionId!),
    enabled: isTracking && trackedTransactionId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && TERMINAL_STATUSES.has(status) ? false : 5000;
    },
  });

  useEffect(() => {
    if (isTrackingError) {
      if (!trackingErrorNotified.current) {
        trackingErrorNotified.current = true;
        setIsTracking(false);
        setTrackedTransactionId(null);
        toastError('Gagal memeriksa status pembayaran. Coba lagi.');
      }
      return;
    }

    trackingErrorNotified.current = false;
    if (!transaction || !TERMINAL_STATUSES.has(transaction.status)) return;
    if (notifiedStatus.current === transaction.status) return;

    notifiedStatus.current = transaction.status;
    setIsTracking(false);
    setTrackedTransactionId(null);
    queryClient.invalidateQueries({ queryKey: ['tenant-bills'] });
    queryClient.invalidateQueries({ queryKey: ['tenant-dashboard-bills'] });

    if (transaction.status === 'SETTLEMENT' || transaction.status === 'CAPTURE') {
      success('Pembayaran berhasil dikonfirmasi.');
    } else if (transaction.status === 'EXPIRE') {
      toastError('Transaksi kedaluwarsa. Silakan buat pembayaran baru.');
    } else {
      toastError('Pembayaran tidak berhasil diselesaikan.');
    }
  }, [isTrackingError, queryClient, success, toastError, transaction]);

  const handlePay = async () => {
    setIsOpening(true);
    notifiedStatus.current = null;
    trackingErrorNotified.current = false;
    callbackStatus.current = null;

    try {
      const snap = await loadMidtransSnap();
      const createdTransaction = await paymentGatewayApi.createTransaction(billId);
      if (!createdTransaction.snap_token) {
        throw new Error('Token pembayaran tidak tersedia');
      }

      queryClient.setQueryData(
        ['payment-transaction', billId, createdTransaction.id],
        createdTransaction,
      );
      setTrackedTransactionId(createdTransaction.id);
      setIsTracking(true);

      snap.pay(createdTransaction.snap_token, {
        onSuccess: () => {
          callbackStatus.current = 'success';
          info('Pembayaran diterima. Menunggu konfirmasi dari server.');
          queryClient.invalidateQueries({ queryKey: ['tenant-bills'] });
          queryClient.invalidateQueries({ queryKey: ['tenant-dashboard-bills'] });
        },
        onPending: () => {
          callbackStatus.current = 'pending';
          info('Pembayaran menunggu penyelesaian. Status akan diperbarui otomatis.');
        },
        onError: () => {
          callbackStatus.current = 'error';
          setIsTracking(false);
          setTrackedTransactionId(null);
          toastError('Pembayaran gagal. Silakan coba lagi.');
        },
        onClose: () => {
          if (callbackStatus.current === 'success' || callbackStatus.current === 'pending') {
            info('Popup ditutup. Status transaksi tetap dipantau.');
            return;
          }

          setIsTracking(false);
          setTrackedTransactionId(null);
          info('Pembayaran dibatalkan. Kamu bisa mencoba lagi.');
        },
      });
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Gagal membuka pembayaran.');
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handlePay}
        disabled={isOpening || isTracking}
        className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isOpening || isTracking ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <ShieldCheck size={16} />
        )}
        {isOpening ? 'Membuka pembayaran...' : isTracking ? 'Menunggu pembayaran...' : 'Bayar Sekarang'}
      </button>
      {isTracking && transaction?.status === 'PENDING' && (
        <p className="inline-flex items-center gap-1.5 text-right text-body-sm text-on-surface-variant" role="status">
          <LoaderCircle size={13} className="animate-spin" />
          Menunggu konfirmasi pembayaran
        </p>
      )}
    </div>
  );
}
