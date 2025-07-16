import React, { useState, useEffect, useCallback } from 'react';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { aptosClient } from 'utils/aptosClient';
import { COINS } from 'utils/const';

const PANCAKE_SWAP_ADDRESS =
  '0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa';
const LIQUID_SWAP_ADDRESS =
  '0xc9ccc585c8e1455a5c0ae4e068897a47e7c16cf16f14e0655e3573c2bbc76d48';

const LIQUIDSWAP_CURVE =
  '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated';

const toRawAmount = (amount, coinType) => {
  const coin = Object.values(COINS).find((c) => c.type === coinType);
  if (!coin) throw new Error('Unknown coin type');
  return Math.floor(parseFloat(amount) * Math.pow(10, coin.decimals));
};
const ACCEPTED_FROM_COINS = [{ symbol: 'APT', type: COINS.APT.type }];
const ACCEPTED_TO_COINS = [{ symbol: 'USDT', type: COINS.USDT.type }];

const buildPancakeSwapPayload = async ({
  coinIn,
  coinOut,
  amountIn,
  minAmountOut,
}) => {
  const rawAmountIn = toRawAmount(amountIn, coinIn);
  console.log(coinIn, 'coinIn');

  const rawMinAmountOut = toRawAmount(minAmountOut, coinOut);
  return {
    function: `${PANCAKE_SWAP_ADDRESS}::router::swap_exact_input`,
    typeArguments: [coinIn, coinOut],
    functionArguments: [String(rawAmountIn), '0'],
  };
};

const buildLiquidSwapPayload = async ({
  coinIn,
  coinOut,
  amountIn,
  minAmountOut,
}) => {
  const rawAmountIn = toRawAmount(amountIn, coinIn);
  const rawMinAmountOut = toRawAmount(minAmountOut, coinOut);
  return {
    function: `${LIQUID_SWAP_ADDRESS}::entry::swap_exact_x_for_y`,
    typeArguments: [coinIn, coinOut],
    arguments: [String(rawAmountIn), String(rawMinAmountOut)],
  };
};

export const useAptosRouterSwap = () => {
  const { account, signAndSubmitTransaction, network } = useWallet();
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState(null);

  const executeSwap = useCallback(
    async (buildPayload, params) => {
      if (!account) {
        alert('Please connect your wallet first.');
        return;
      }
      setLoading(true);
      setTxResult(null);
      console.log(network, 'connectedconnected');

      const payload = await buildPayload(params);
      console.log(payload, 'payloadpayload');

      try {
        const response = await signAndSubmitTransaction({
          sender: account?.address,
          data: payload,
        });

        await aptosClient().waitForTransaction({
          transactionHash: response.hash,
        });

        setTxResult({ success: true, hash: response.hash });
      } catch (error) {
        console.error('Transaction error:', error);
        setTxResult({ success: false, message: error.message });
      } finally {
        setLoading(false);
      }
    },
    [account, signAndSubmitTransaction],
  );
  const getSwapInfo = async () => {};

  const swapOnPancake = async (from, to, amount) => {
    const fromCoin = ACCEPTED_FROM_COINS.find(
      (coin) => coin.symbol.toUpperCase() === from.toUpperCase(),
    );
    const toCoin = ACCEPTED_TO_COINS.find(
      (coin) => coin.symbol.toUpperCase() === to.toUpperCase(),
    );
    console.log(fromCoin);
    if (!fromCoin || !toCoin) {
      throw new Error(
        `Unsupported swap from ${from} to ${to}. Supported pairs: ${ACCEPTED_FROM_COINS.map(
          (c) => c.symbol,
        ).join(', ')} to ${ACCEPTED_TO_COINS.map((c) => c.symbol).join(', ')}`,
      );
    }
    const params = {
      coinIn: fromCoin.type,
      coinOut: toCoin.type,
      amountIn: amount,
      minAmountOut: 0.01, // Set a minimum output amount
    };
    return executeSwap(buildPancakeSwapPayload, params);
  };

  const swapOnLiquid = async (from, to, amount) => {
    const fromCoin = ACCEPTED_FROM_COINS.find(
      (coin) => coin.symbol.toUpperCase() === from.toUpperCase(),
    );
    const toCoin = ACCEPTED_TO_COINS.find(
      (coin) => coin.symbol.toUpperCase() === to.toUpperCase(),
    );
    if (!fromCoin || !toCoin) {
      throw new Error(
        `Unsupported swap from ${from} to ${to}. Supported pairs: ${ACCEPTED_FROM_COINS.map(
          (c) => c.symbol,
        ).join(', ')} to ${ACCEPTED_TO_COINS.map((c) => c.symbol).join(', ')}`,
      );
    }
    const params = {
      coinIn: fromCoin.type,
      coinOut: toCoin.type,
      amountIn: amount,
      minAmountOut: 0.01, // Set a minimum output amount
    };
    return executeSwap(buildLiquidSwapPayload, params);
  };

  return {
    loading,
    txResult,
    swapOnPancake,
    swapOnLiquid,
  };
};
