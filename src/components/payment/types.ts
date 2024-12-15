export type PaymentMethod = 'card' | 'gcash' | 'grab_pay' | 'paymaya';

export interface PaymentDetails {
  paymentId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
}