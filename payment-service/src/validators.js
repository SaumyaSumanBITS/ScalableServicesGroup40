/*
 * Validation helpers for the payment service.  Ensures the required
 * fields are present when charging or refunding payments.
 */

function _isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

function validatePaymentCharge(body) {
  if (!body || typeof body !== 'object') return { error: 'Request body must be an object' };
  const { orderId, userId, amount } = body;
  if (!_isNonEmptyString(orderId)) return { error: 'orderId is required' };
  if (!_isNonEmptyString(userId)) return { error: 'userId is required' };
  const amt = typeof amount === 'number' ? amount : Number(amount);
  if (!(amt > 0)) return { error: 'amount must be positive' };
  return { value: { orderId: orderId.trim(), userId: userId.trim(), amount: amt } };
}

function validatePaymentRefund(body) {
  if (!body || typeof body !== 'object') return { error: 'Request body must be an object' };
  const { paymentId } = body;
  if (!_isNonEmptyString(paymentId)) return { error: 'paymentId is required' };
  return { value: { paymentId: paymentId.trim() } };
}

module.exports = {
  validatePaymentCharge,
  validatePaymentRefund,
};