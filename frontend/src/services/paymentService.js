function generateTransactionId() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SS-${Date.now()}-${suffix}`;
}

export async function processMockPayment({
  amount,
  paymentMethod,
  roomTitle,
}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        transactionId: generateTransactionId(),
        amount,
        paymentMethod,
        roomTitle,
        paidAt: new Date().toISOString(),
      });
    }, 2000);
  });
}
