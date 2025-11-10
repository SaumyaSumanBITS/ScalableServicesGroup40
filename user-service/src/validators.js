

function _isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

function validateUserCreate(body) {
  if (!body || typeof body !== 'object') {
    return { error: 'Request body must be an object' };
  }
  const { name, email } = body;
  if (!_isNonEmptyString(name)) return { error: 'Name is required' };
  if (!_isNonEmptyString(email) || !email.includes('@')) return { error: 'Email must be valid' };
  return { value: { name: name.trim(), email: email.trim() } };
}

function validateUserUpdate(body) {
  if (!body || typeof body !== 'object') return { error: 'Request body must be an object' };
  const value = {};
  const { name, email } = body;
  if (name !== undefined) {
    if (!_isNonEmptyString(name)) return { error: 'Name is required' };
    value.name = name.trim();
  }
  if (email !== undefined) {
    if (!_isNonEmptyString(email) || !email.includes('@')) return { error: 'Email must be valid' };
    value.email = email.trim();
  }
  return { value };
}

module.exports = {
  validateUserCreate,
  validateUserUpdate,
};