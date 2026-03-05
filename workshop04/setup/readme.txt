# Install and update repos
helm repo add traefik https://traefik.github.io/charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Instal Gateway API
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.4.0/standard-install.yaml
kubectl apply -f https://raw.githubusercontent.com/traefik/traefik/v3.6/docs/content/reference/dynamic-configuration/kubernetes-gateway-rbac.yml
helm install traefik traefik/traefik -ntraefik --create-namespace -f ./values-traefik.yaml

IMPORTANT: Change TRAEFIK_IP to load balancer IP address
kubectl apply -f traefik-http-route.yaml

# Install prometheus stack
helm install prom-stack prometheus-community/kube-prometheus-stack -nmonitoring --create-namespace -f ./values-prometheus.yaml

# Install Tempo
IMPORTANT: update the storageClass in values-tempo.yaml and the Prometheus write endpoint in values-tempo.yaml before installing
helm install tempo grafana/tempo -ntempo --create-namespace -f ./values-tempo.yaml

# Install Loki
IMPORTANT: update the storageClass in values-loki.yaml before running the command
helm install loki grafana/loki -nloki --create-namespace -f ./values-loki.yaml

# Install Open Telemetry Operator
https://opentelemetry.io/docs/platforms/kubernetes/helm/operator/
helm install my-opentelemetry-operator open-telemetry/opentelemetry-operator -f ./values-oteloperator.yaml -notel --create-namespace

# Expose Grafana and Prometheus
kubectl apply -f prom-http-routes.yaml

# Grafana's admin user name and password
kubectl get secret/prom-stack-grafana -nmonitoring -ojsonpath='{.data.admin-user}' | base64 -d -
kubectl get secret/prom-stack-grafana -nmonitoring -ojsonpath='{.data.admin-password}' | base64 -d -

