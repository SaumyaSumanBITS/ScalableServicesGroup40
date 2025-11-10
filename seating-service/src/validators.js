
function _isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

function validateSeatReservation(body) {
  if (!body || typeof body !== 'object') return { error: 'Request body must be an object' };
  const { eventId, userId, seatIds } = body;
  if (!_isNonEmptyString(eventId)) return { error: 'eventId is required' };
  if (!_isNonEmptyString(userId)) return { error: 'userId is required' };
  if (!Array.isArray(seatIds) || seatIds.length === 0 || seatIds.some((id) => !_isNonEmptyString(id))) {
    return { error: 'At least one valid seatId must be provided' };
  }
  return { value: { eventId: eventId.trim(), userId: userId.trim(), seatIds: seatIds.map((id) => id.trim()) } };
}

// Release and allocate use the same structure
const validateSeatRelease = validateSeatReservation;

module.exports = {
  validateSeatReservation,
  validateSeatRelease,
};