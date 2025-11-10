# Observability Update (Metrics + Correlation IDs)

Unzip this **at the root** of your existing project where `user-service/`, `catalog-service/`, `seating-service/`, `payment-service/`, `order-service/` live.

## Adds
- `src/logger.js` in every service (correlation IDs + structured JSON logs)
- `src/metrics.js` in every service
  - order-service: `orders_total{status}`
  - seating-service: `seat_reservations_failed{reason}`
  - payment-service: `payments_failed_total{reason}`
  - user-service & catalog-service: default Node metrics
- `k8s/prometheus.yaml` to run Prometheus that scrapes all services

## 1) Dependencies (each service)
Add to `package.json` dependencies:
```json
"prom-client": "^15.1.0",
"uuid": "^9.0.1"
```
Rebuild images after changes.

## 2) Wire middleware & /metrics route (each service)
In `src/server.js`:
```js
const { correlationMiddleware } = require('./logger');
app.use(correlationMiddleware);

const { register } = require('./metrics');
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).send(err.message);
  }
});
```

## 3) Increment counters
- order-service (on success/failure):
```js
const { ordersTotal } = require('./metrics');
ordersTotal.inc({ status: 'success' });
// in catch:
ordersTotal.inc({ status: 'failed' });
```
- seating-service (on reservation failure):
```js
const { seatReservationsFailed } = require('./metrics');
seatReservationsFailed.inc({ reason: 'unavailable' });
```
- payment-service (on payment failure):
```js
const { paymentsFailedTotal } = require('./metrics');
paymentsFailedTotal.inc({ reason: 'db_error' });
```

## 4) Propagate correlation ID on inter-service calls
```js
await axios.post(url, body, { headers: { 'X-Correlation-Id': req.correlationId } });
```

## 5) Rebuild & restart (Minikube)
```powershell
minikube docker-env --shell powershell | Invoke-Expression

docker build -t user-service:latest     -f user-service/Dockerfile         .
docker build -t catalog-service:latest  -f catalog-service/Dockerfile      .
docker build -t seating-service:latest  -f seating-service/Dockerfile      .
docker build -t payment-service:latest  -f payment-service/Dockerfile      .
docker build -t order-service:latest    -f order-service/Dockerfile        .

kubectl rollout restart deployment/user-service
kubectl rollout restart deployment/catalog-service
kubectl rollout restart deployment/seating-service
kubectl rollout restart deployment/payment-service
kubectl rollout restart deployment/order-service
```

## 6) Prometheus
```powershell
kubectl apply -f k8s/prometheus.yaml
kubectl port-forward svc/prometheus 9090:9090
# open http://localhost:9090 and query: orders_total, payments_failed_total, seat_reservations_failed
```
