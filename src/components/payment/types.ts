export type PaymentMethod = 'card' | 'gcash' | 'grab_pay' | 'maya';

export interface PaymentDetails {
  paymentId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
}