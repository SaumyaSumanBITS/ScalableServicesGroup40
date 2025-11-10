const fetch = (...a) => import('node-fetch').then(({default: f}) => f(...a));
async function postJSON(url, body, extra={}){
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(extra.headers||{}) },
    body: JSON.stringify(body)
  });
  if (!res.ok){
    const t = await res.text().catch(()=>'');
    throw new Error(`POST ${url} -> ${res.status}: ${t}`);
  }
  return res.json();
}
async function getJSON(url, extra={}){
  const res = await fetch(url, { headers: extra.headers||{
    headers: {
      'X-Correlation-Id': req.correlationId,
    },
  } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}
module.exports = { postJSON, getJSON };
