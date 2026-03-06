# Sprint-4 Kubernetes Demo (FastAPI)

## Scope
This demo deploys the Sprint-3 FastAPI service to Kubernetes as a Phase-I proof path.

## Files
- `k8s/namespace.yaml`
- `k8s/configmap.yaml`
- `k8s/deployment.yaml`
- `k8s/service.yaml`
- `../Sprint-3/Dockerfile`

## Prerequisites
- Docker Desktop running.
- A Kubernetes cluster (Docker Desktop Kubernetes, kind, or minikube).
- `kubectl` configured for your cluster.

## 1) Build API Image
```powershell
cd "D:\LUMS\Spring'26\SPROJ P06\Github\P06_Anomalous-Login-Detection-ELK\Development\Sprint-3"
docker build -t alds-sprint3-api:latest .
```

## 2) Load Image into Cluster (if needed)
For kind:
```powershell
kind load docker-image alds-sprint3-api:latest
```

For Docker Desktop Kubernetes, this step is usually not required.

## 3) Deploy Manifests
```powershell
cd "D:\LUMS\Spring'26\SPROJ P06\Github\P06_Anomalous-Login-Detection-ELK\Development\Sprint-4"
kubectl apply -f .\k8s\namespace.yaml
kubectl apply -f .\k8s\configmap.yaml
kubectl apply -f .\k8s\deployment.yaml
kubectl apply -f .\k8s\service.yaml
```

## 4) Verify Deployment
```powershell
kubectl get pods -n alds
kubectl get svc -n alds
kubectl describe deployment alds-api -n alds
```

## 5) Access API
Option A: NodePort (configured to `30080`)
- `http://localhost:30080/docs`

Option B: Port-forward
```powershell
kubectl port-forward svc/alds-api 8000:8000 -n alds
```
Then open:
- `http://localhost:8000/docs`

## 6) Cleanup
```powershell
kubectl delete namespace alds
```

## Evidence to Capture
- `kubectl get pods -n alds` output with `Running` pod.
- Swagger UI screenshot from `/docs`.
- One successful API call response screenshot.
