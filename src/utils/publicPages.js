export const defaultPublicPages = {
  track: {
    title: 'Track Delivery',
    intro: 'Track your delivery in real time with your code and get clear status updates from pickup to dropoff.',
    points: [
      'Enter your tracking code and view live progress instantly.',
      'See rider assignment, status updates, and route movement.',
      'Chat or call when needed during active deliveries.'
    ],
    footer: 'Need help with tracking? Contact support with your tracking code for fast resolution.'
  },
  promotions: {
    title: 'Promotions',
    intro: 'Smart rewards for repeat customers, referrals, and business volume.',
    points: [
      'First request: 15% off up to KES 300.',
      '5+ deliveries in 7 days: 8% loyalty discount.',
      'Business volume pricing from 50 monthly deliveries.',
      'Referral bonus: KES 200 credit after first successful referral order.'
    ],
    footer: 'Every active offer is shown clearly before you confirm your request.'
  },
  support: {
    title: 'Support',
    intro: 'Real people, fast response, and practical help for every delivery.',
    points: [
      'Call: +254 700 111 222',
      'WhatsApp: +254 700 111 222',
      'Email: support@efikishe.com',
      'Hours: 06:00 - 22:00 EAT, all week'
    ],
    footer: 'For active deliveries, include your tracking code for priority assistance.'
  },
  about: {
    title: 'About Efikishe',
    intro: 'Efikishe is built to move Nairobi faster while protecting the environment through electric delivery.',
    points: [
      'Electric-first dispatch to reduce emissions and urban noise.',
      'Lower operating costs translated into better prices.',
      'Reliable same-day movement for homes, merchants, and businesses.',
      'Rider dignity, safety, and consistent earnings at the center of operations.'
    ],
    footer: 'Our mission is simple: save time, save money, and keep our city cleaner.'
  },
  payments: {
    title: 'Payments',
    intro: 'Simple, secure, and flexible payment options for individuals and businesses.',
    points: [
      'M-Pesa STK Push for instant checkout.',
      'Visa and Mastercard support.',
      'Monthly invoicing for approved business accounts.',
      'Automatic receipts after every successful payment.'
    ],
    footer: 'Payment support is available on payments@efikishe.com for quick issue resolution.'
  }
}

export const mergePublicPages = (remote) => {
  const source = remote && typeof remote === 'object' ? remote : {}
  const out = {}
  for (const key of Object.keys(defaultPublicPages)) {
    out[key] = {
      ...defaultPublicPages[key],
      ...(source[key] || {})
    }
    if (!Array.isArray(out[key].points)) out[key].points = [...defaultPublicPages[key].points]
  }
  return out
}

