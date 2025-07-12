import React, { useState, useEffect, useCallback } from 'react';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { aptosClient } from 'utils/aptosClient';
import { COINS } from 'utils/const';

const PANCAKE_SWAP_ADDRESS = '0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa';
const LIQUID_SWAP_ADDRESS = '0xc9ccc585c8e1455a5c0ae4e068897a47e7c16cf16f14e0655e3573c2bbc76d48';



const LIQUIDSWAP_CURVE = '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated';

// --- CÁC HÀM HELPER ---

// Chuyển đổi số lượng sang đơn vị nhỏ nhất (raw amount)
const toRawAmount = (amount, coinType) => {
    const coin = Object.values(COINS).find(c => c.type === coinType);
    if (!coin) throw new Error("Loại coin không xác định");
    return Math.floor(parseFloat(amount) * Math.pow(10, coin.decimals));
};

// Xây dựng payload cho giao dịch PancakeSwap
const buildPancakeSwapPayload = async ({ coinIn, coinOut, amountIn, minAmountOut }) => {
    const rawAmountIn = toRawAmount(amountIn, coinIn);
    console.log(coinIn, 'coinIn');
    
    const rawMinAmountOut = toRawAmount(minAmountOut, coinOut);
    return {
        function: `${PANCAKE_SWAP_ADDRESS}::router::swap_exact_input`,
        typeArguments: [coinIn, coinOut],
        functionArguments: [String(rawAmountIn), "0"],
    };
};

// Xây dựng payload cho giao dịch LiquidSwap
const buildLiquidSwapPayload = async ({ coinIn, coinOut, amountIn, minAmountOut }) => {
    const rawAmountIn = toRawAmount(amountIn, coinIn);
    const rawMinAmountOut = toRawAmount(minAmountOut, coinOut);
    return {
        function: `${LIQUID_SWAP_ADDRESS}::entry::swap_exact_x_for_y`,
        typeArguments: [coinIn, coinOut],
        arguments: [String(rawAmountIn), String(rawMinAmountOut)],
    };
};


// --- CUSTOM HOOK: useAptosSwap ---
export const useAptosRouterSwap = () => {
    const { account, signAndSubmitTransaction, network } = useWallet();
    const [loading, setLoading] = useState(false);
    const [txResult, setTxResult] = useState(null);
  
    const executeSwap = useCallback(async (buildPayload, params) => {
      if (!account) {
        alert('Vui lòng kết nối ví trước.');
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
        
        await aptosClient().waitForTransaction({ transactionHash: response.hash });
        
        setTxResult({ success: true, hash: response.hash });
  
      } catch (error) {
        console.error('Lỗi giao dịch:', error);
        setTxResult({ success: false, message: error.message });
      } finally {
        setLoading(false);
      }
    }, [account, signAndSubmitTransaction]);
  
    const swapOnPancake = (params) => executeSwap(buildPancakeSwapPayload, params);
    const swapOnLiquid = (params) => executeSwap(buildLiquidSwapPayload, params);
  
    return {
      loading,
      txResult,
      swapOnPancake,
      swapOnLiquid,
    };
  };

