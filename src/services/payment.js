// Payment integration placeholder (M-Pesa/Card to be implemented later)
export const paymentService = {
  async initializePaymentIntent({ orderId, amount, currency = 'KES' }) {
    return {
      ok: true,
      provider: 'placeholder',
      status: 'pending',
      payment_reference: `PMT-${orderId}-${Date.now()}`,
      amount,
      currency
    }
  },

  async confirmPayment() {
    return { ok: false, status: 'pending', message: 'Payment provider integration pending.' }
  }
}
