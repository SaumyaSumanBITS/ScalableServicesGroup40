const cache = new Map();
function idempotentRoute(handler) {
  return async (req, res) => {
    const key = req.headers['idempotency-key'];
    if (!key) return handler(req, res);
    if (cache.has(key)) {
      const { status, body } = cache.get(key);
      return res.status(status).json(body);
    }
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (!cache.has(key)) cache.set(key, { status: res.statusCode || 200, body: data });
      return originalJson(data);
    };
    return handler(req, res);
  };
}
module.exports = { idempotentRoute };
