Step by Step execution Instructions:
Tools: Docker, Minikube, Kubernetes and Prometheus Runbook

The following lists the commands and steps needed to run the microservices project with Docker, Minikube (local Kubernetes) and Prometheus on a Windows machine using PowerShell.
Clone this Repository.
1. Prerequisites
Install and verify the following tools:
• Docker Desktop (with Kubernetes disabled – we use Minikube).
• Minikube.
• kubectl (usually installed with Minikube).
• Node.js 18+ (only required if you want to run services directly).
Check versions:
docker --version
minikube version
kubectl version --client
2. Project Folder Layout
Unzip the project into a folder such as:
F:\mtech\scalable service\microservices_dockerized
The folder should contain subfolders like:
• user-service
• catalog-service
• seating-service
• order-service
• payment-service
• k8s (Kubernetes manifests)
• prometheus (Prometheus config)
3. Start Minikube and Configure Docker
Open PowerShell and run:
cd "F:\mtech\scalable service\microservices_dockerized"

# Use Docker as driver (only once)
minikube config set driver docker

# Start the Minikube cluster
minikube start

# Point Docker CLI to Minikube Docker daemon (run in each new session)
minikube docker-env --shell powershell | Invoke-Expression
4. Build Docker Images for All Services
From the project root:
cd "F:\mtech\scalable service\microservices_dockerized"

docker build -t user-service:latest     -f user-service/Dockerfile         .
docker build -t catalog-service:latest  -f catalog-service/Dockerfile      .
docker build -t seating-service:latest  -f seating-service/Dockerfile      .
docker build -t order-service:latest    -f order-service/Dockerfile        .
docker build -t payment-service:latest  -f payment-service/Dockerfile      .

# Verify images
docker images
5. Apply Kubernetes Manifests
Apply ConfigMap, Deployments, Services and Prometheus manifests:
cd "F:\mtech\scalable service\microservices_dockerized"

# ConfigMap for shared configuration
kubectl apply -f k8s/configmap.yaml

# Microservices
kubectl apply -f k8s/user-service-deployment.yaml    -f k8s/user-service-service.yaml
kubectl apply -f k8s/catalog-service-deployment.yaml -f k8s/catalog-service-service.yaml
kubectl apply -f k8s/seating-service-deployment.yaml -f k8s/seating-service-service.yaml
kubectl apply -f k8s/payment-service-deployment.yaml -f k8s/payment-service-service.yaml
kubectl apply -f k8s/order-service-deployment.yaml   -f k8s/order-service-service.yaml

# Prometheus
kubectl apply -f k8s/prometheus.yaml

# Check objects
kubectl get pods
