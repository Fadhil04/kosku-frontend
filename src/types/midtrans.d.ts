export {};

declare global {
  interface MidtransSnapResult {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
    fraud_status?: string;
  }

  interface MidtransSnapOptions {
    onSuccess?: (result: MidtransSnapResult) => void;
    onPending?: (result: MidtransSnapResult) => void;
    onError?: (result: MidtransSnapResult) => void;
    onClose?: () => void;
  }

  interface MidtransSnap {
    pay(token: string, options?: MidtransSnapOptions): void;
  }

  interface Window {
    snap?: MidtransSnap;
  }
}
