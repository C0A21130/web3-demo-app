#!/bin/bash
# This script is used to start a blockchain node using Geth.
# It sets up the environment variables, checks for the necessary files,
# and starts the Geth process with the specified parameters.

node=0
dir="/home/ssdl_user/QBFT-Network/Node-${node}"

# check if the directory is empty
if [ ! -d "${dir}" ]; then
    echo "[ERROR] Directory ${dir} does not exist."
    exit 1
fi
# check if the keystore file exists
if [ ! -f "${dir}/data/keystore/accountKeystore" ]; then
    echo "[ERROR] Keystore file ${dir}/data/keystore/accountKeystore does not exist."
    exit 1
fi
# check if the password file exists
if [ ! -f "${dir}/data/keystore/accountPassword" ]; then
    echo "[ERROR] Password file ${dir}/data/keystore/accountPassword does not exist."
    exit 1
fi
# check if the genesis file exists
if [ ! -f "${dir}/data/genesis.json" ]; then
    echo "[ERROR] Genesis file ${dir}/data/genesis.json does not exist."
    exit 1
fi

# address and private config
export ADDRESS=$(grep -o '"address": *"[^"]*"' ${dir}/data/keystore/accountKeystore | grep -o '"[^"]*"$' | sed 's/"//g')
export PRIVATE_CONFIG=ignore

# check if the address and private config are set
if [ -z "${ADDRESS}" ]; then
    echo "[ERROR] Failed to extract address from keystore."
    exit 1
fi
if [ -z "${PRIVATE_CONFIG}" ]; then
    echo "[ERROR] Failed to set private config."
    exit 1
fi

# output information for the blockchain node
echo "[INFO] START UP Blockchain Node-${node}"
echo "----------------------------------------"
echo "NODE: Node-${node}"
echo "DIRECTOORY: ${dir}"
echo "ADDRESS: ${ADDRESS}"
echo "PRIVATE_CONFIG: ${PRIVATE_CONFIG}"
echo "----------------------------------------"
echo ""

# check geth
if [ ! -f "/usr/local/bin/geth" ]; then
    echo "[EROOR] Geth is not installed"
    exit 1
fi

nohup /usr/local/bin/geth --datadir "${dir}/data" \
    --networkid 1337 --nodiscover --verbosity 5 --syncmode full --istanbul.blockperiod 5 \
    --mine --miner.threads 1 --miner.gasprice 0 --emitcheckpoints \
    --http --http.addr 0.0.0.0 --http.port 22000 --http.corsdomain "*" --http.vhosts "*" \
    --ws --ws.addr 0.0.0.0 --ws.port 32000 --ws.origins "*" \
    --http.api admin,eth,debug,miner,net,txpool,personal,web3,istanbul \
    --ws.api admin,eth,debug,miner,net,txpool,personal,web3,istanbul \
    --unlock ${ADDRESS} --allow-insecure-unlock --password "${dir}/data/keystore/accountPassword" --port 30300 \
    --metrics --metrics.influxdb --metrics.influxdb.endpoint "http://10.203.92.92:8086" \
    --metrics.influxdb.username "geth" --metrics.influxdb.password "password" --metrics.influxdb.tags "host=node-${node}" \
    > "${dir}/geth.log" 2>&1 &

# check process for geth
ps=`ps aux | grep geth | grep -v grep | wc -l`
if [ $ps -gt 0 ]; then # check if geth process is running
    echo "[INFO] Geth Process"
    echo "----------------------------------------"
    echo "Process: running."
    echo "Geth process ID: $(pgrep geth)"
    echo "Log File: ${dir}/geth.log"
    echo "----------------------------------------"
    echo ""
else
    echo "[ERROR] Geth Process"
    echo "----------------------------------------"
    echo "Process: not running."
    echo "Log File: ${dir}/geth.log"
    echo "Please check the log file: ${dir}/geth.log"
    echo "----------------------------------------"
    echo ""
fi
