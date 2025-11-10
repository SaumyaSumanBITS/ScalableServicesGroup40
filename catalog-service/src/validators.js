

function _isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

function _parseDate(val) {
  const ts = Date.parse(val);
  return !isNaN(ts);
}

function validateEventCreate(body) {
  if (!body || typeof body !== 'object') return { error: 'Request body must be an object' };
  const { name, city, date, venueId, status } = body;
  if (!_isNonEmptyString(name)) return { error: 'Event name is required' };
  if (!_isNonEmptyString(city)) return { error: 'City is required' };
  if (!_isNonEmptyString(date) || !_parseDate(date)) return { error: 'Date must be a valid ISO date string' };
  if (!_isNonEmptyString(venueId)) return { error: 'Venue identifier is required' };
  const allowed = ['ON_SALE', 'SOLD_OUT', 'CANCELLED'];
  let finalStatus = 'ON_SALE';
  if (status !== undefined) {
    if (typeof status !== 'string' || !allowed.includes(status)) return { error: 'Invalid status' };
    finalStatus = status;
  }
  return { value: { name: name.trim(), city: city.trim(), date, venueId: venueId.trim(), status: finalStatus, description: body.description } };
}

module.exports = {
  validateEventCreate,
};