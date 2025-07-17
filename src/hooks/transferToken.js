import { useState, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import toast from 'react-hot-toast';

const SUPPORTED_TOKENS = {
  APT: '0x1::aptos_coin::AptosCoin',
  // USDT: '0x...::usdt::USDT',
  // USDC: '0x...::usdc::USDC',
};

export function useAptosTransfer() {
  const { account, signAndSubmitTransaction } = useWallet();

  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const transfer = useCallback(
    async (toAddress, amount, tokenName = 'APT') => {
      setLoading(true);
      setTxHash('');
      setError('');
      try {
        const typeArg = SUPPORTED_TOKENS[tokenName.toUpperCase()];
        if (!typeArg) {
          const errMsg = `Token "${tokenName}" is not supported!`;
          setError(errMsg);
          toast.error(errMsg);
          throw new Error(errMsg);
        }
        const decimals = tokenName.toUpperCase() === 'APT' ? 1e8 : 1;
        const amountRaw = Math.floor(Number(amount) * decimals);

        const response = await signAndSubmitTransaction({
          sender: account.address,
          data: {
            function: '0x1::coin::transfer',
            typeArguments: [typeArg],
            functionArguments: [toAddress, amountRaw.toString()],
          },
        });
        setTxHash(response.hash);
        return {
          success: true,
          txHash: response.hash,
        };
      } catch (e) {
        setError(e.message || 'Transfer failed');
        toast.error(e.message || 'Transfer failed');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction, account?.address],
  );

  return {
    transfer,
    loading,
    txHash,
    error,
    account,
    SUPPORTED_TOKENS,
  };
}
