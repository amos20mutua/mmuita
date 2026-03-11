export const notificationService = {
  async sendOrderCreated({ order }) {
    // TODO: plug SMS/WhatsApp/Email provider
    return { ok: true, channel: 'in_app', order_id: order?.id }
  }
}
