#!/bin/bash
# Installs all prereg-ui helm charts
## Usage: ./install.sh [kubeconfig]

if [ $# -ge 1 ] ; then
  export KUBECONFIG=$1
fi

NS=prereg
CHART_VERSION=12.0.1-develop

echo Create $NS namespace
kubectl create ns $NS

function installing_prereg_ui() {
  echo Istio label
  ## TODO: Istio proxy disabled for now as prereui does not come up if
  ## envoy filter container gets installed after prereg-uicontainer.
  kubectl label ns $NS istio-injection=disabled --overwrite
  helm repo update

  echo Copy configmaps
  sed -i 's/\r$//' copy_cm.sh
  ./copy_cm.sh

  API_HOST=`kubectl get cm global -o jsonpath={.data.mosip-api-host}`
  PREREG_HOST=`kubectl get cm global -o jsonpath={.data.mosip-prereg-host}`

  echo Install prereg-gateway
  helm -n $NS install prereg-gateway mosip/prereg-gateway --set istio.hosts[0]=$PREREG_HOST --version $CHART_VERSION

  echo Installing prereg-ui
  helm -n $NS install prereg-ui mosip/prereg-ui --set prereg.apiHost=$PREREG_HOST --version $CHART_VERSION

  kubectl -n $NS  get deploy -o name |  xargs -n1 -t  kubectl -n $NS rollout status

  echo Installed prereg-ui services
  return 0
}

# set commands for error handling.
set -e
set -o errexit   ## set -e : exit the script if any statement returns a non-true return value
set -o nounset   ## set -u : exit the script if you try to use an uninitialised variable
set -o errtrace  # trace ERR through 'time command' and other functions
set -o pipefail  # trace ERR through pipes
installing_prereg_ui  # calling function
