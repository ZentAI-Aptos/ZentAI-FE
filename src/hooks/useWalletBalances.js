import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { aptosClient } from 'utils/aptosClient';
import { COINS } from 'utils/const';

export const useWalletBalances = (address, tokenType) => {
  const { account } = useWallet();
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchExternalBalance = useCallback(async (address, tokenSymbol) => {
    const coin = Object.values(COINS).find((c) => c.symbol === tokenSymbol);
    if (!coin) {
      throw new Error(`Token ${tokenSymbol} not recognized.`);
    }

    try {
      const [balanceStr] = await aptosClient().view({
        payload: {
          function: '0x1::coin::balance',
          typeArguments: [coin.type],
          functionArguments: [address],
        },
      });
      const rawAmount = parseInt(balanceStr, 10);
      return {
        amount: rawAmount / 10 ** coin.decimals,
        symbol: coin.symbol,
      };
    } catch (e) {
      if (e.status === 404) {
        return { amount: 0, symbol: coin.symbol };
      }
      console.error('Blockchain Error:', e);
      throw new Error('Could not fetch balance from the blockchain.');
    }
  }, []);

  const fetchBalances = useCallback(async () => {
    const targetAddress = address || account?.address;
    if (!targetAddress) return;

    setLoading(true);
    try {
      let tokensToFetch = Object.values(COINS);

      if (tokenType) {
        const specificCoin = Object.values(COINS).find(
          (c) => c.type === tokenType,
        );
        tokensToFetch = specificCoin ? [specificCoin] : [];
      }

      if (tokensToFetch.length === 0 && tokenType) {
        setBalances({});
        setLoading(false);
        return;
      }

      const balancePromises = tokensToFetch.map(async (coin) => {
        try {
          const [balanceStr] = await aptosClient().view({
            payload: {
              function: '0x1::coin::balance',
              typeArguments: [coin.type],
              functionArguments: [targetAddress],
            },
          });

          const rawAmount = parseInt(balanceStr, 10);
          return {
            symbol: coin.symbol,
            name: coin.symbol,
            amount: rawAmount / 10 ** coin.decimals,
            decimals: coin.decimals,
            type: coin.type,
          };
        } catch (e) {
          return {
            symbol: coin.symbol,
            name: coin.symbol,
            amount: 0,
            decimals: coin.decimals,
            type: coin.type,
          };
        }
      });

      const results = await Promise.all(balancePromises);
      const balancesObject = results.reduce((acc, coin) => {
        acc[coin.symbol] = coin;
        return acc;
      }, {});

      setBalances(balancesObject);
    } catch (error) {
      setBalances({});
    } finally {
      setLoading(false);
    }
  }, [account?.address, address, tokenType]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return { balances, loading, fetchBalances, fetchExternalBalance };
};
