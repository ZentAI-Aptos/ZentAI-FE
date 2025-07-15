import { useState, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import toast from 'react-hot-toast';

// Map token name -> type argument (resource address)
// Nếu muốn hỗ trợ thêm token, thêm vào đây
const SUPPORTED_TOKENS = {
  APT: '0x1::aptos_coin::AptosCoin',
  // USDT: "0x...::usdt::USDT", // VD: thay bằng type argument thật
  // USDC: "0x...::usdc::USDC",
};

export function useAptosTransfer() {
  const { account, signAndSubmitTransaction } = useWallet();

  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  /**
   * Transfer token to another address
   * @param {string} toAddress - The recipient address
   * @param {number} amount - Amount (the token amount, NOT octa)
   * @param {string} tokenName - Token name, e.g., "APT", "USDT"
   */
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
        // amount: luôn chuyển về Octa với APT, hoặc decimals của token (bạn có thể bổ sung tuỳ token)
        const decimals = tokenName.toUpperCase() === 'APT' ? 1e8 : 1; // Mặc định 1 với token chưa rõ decimals
        const amountRaw = Math.floor(Number(amount) * decimals);
        const tx = {
          type: 'entry_function_payload',
          function: '0x1::coin::transfer',
          type_arguments: [typeArg],
          arguments: [toAddress, amountRaw.toString()],
        };

        const response = await signAndSubmitTransaction(tx);
        setTxHash(response.hash);
        return response.hash;
      } catch (e) {
        setError(e.message || 'Transfer failed');
        if (!e.toast) toast.error(e.message || 'Transfer failed');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [signAndSubmitTransaction],
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
