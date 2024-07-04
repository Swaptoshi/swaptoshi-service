#!/bin/sh
KLAYR_CORE_BIN=lisk-core
CONFIG_DIR=~/.lisk/lisk-core/config/devnet
SNAPSHOT_DIR=./snapshots/
WS_HOST=127.0.0.1
WS_PORT=5001

echo "Copying genesis block to ${CONFIG_DIR}"
mkdir -p "${CONFIG_DIR}"
cp ./config/genesis_block.json "${CONFIG_DIR}"

"${KLAYR_CORE_BIN}" blockchain:import "${SNAPSHOT_DIR}blockchain.db.tar.gz" --force
"${KLAYR_CORE_BIN}" forger-info:import "${SNAPSHOT_DIR}forger.db.tar.gz" --force

echo "Use this variable for Lisk Service -> export KLAYR_CORE_WS=ws://${WS_HOST}:${WS_PORT}"

echo "Running Lisk Core: $(which lisk-core)"
"${KLAYR_CORE_BIN}" start --network=devnet --api-ws --api-ws-host=${WS_HOST} --api-ws-port=${WS_PORT} --enable-forger-plugin
