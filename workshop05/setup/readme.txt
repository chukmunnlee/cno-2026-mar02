# Install and update the Helm repos
helm repo add chaos-mesh https://charts.chaos-mesh.org
helm repo update

# Install Chaos-Mesh
helm install chaos-mesh chaos-mesh/chaos-mesh -nchaos-mesh --create-namespace -f values-chaos-mesh.yaml

# Access dashboard
# Change the host to traefik IP
kubectl apply -f /chaosmesh-httproute.yaml

# Create access token for 1 day
kubectl create token chaos-dashboard -nchaos-mesh --duration=86400s | tee chaos-dashboard-token.txt

