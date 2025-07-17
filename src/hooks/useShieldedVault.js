import { useState, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { aptosClient } from '../utils/aptosClient';
import { VAULT_CONTRACT_ADDRESS } from 'utils/const';
import { toHexString } from 'utils';
import { COINS } from 'utils/const';
import toast from 'react-hot-toast';
import { toRawAmount } from 'utils';

const buildInitializePayload = async ({ coinType }) => {
  return {
    function: `${VAULT_CONTRACT_ADDRESS.packageId}::shielded_vault::initialize_vault`,
    typeArguments: [coinType],
    functionArguments: [],
  };
};

const buildDepositPayload = async ({
  coinType,
  amount,
}) => {
  return {
    function: `${VAULT_CONTRACT_ADDRESS.packageId}::shielded_vault::deposit`,
    typeArguments: [coinType],
    functionArguments: [String(amount)],
  };
};

const buildWithdrawPayload = async (params) => {
  const {
    coinType,
    amount,
    recipient,
  } = params;

  return {
    function: `${VAULT_CONTRACT_ADDRESS.packageId}::shielded_vault::withdraw`,
    typeArguments: [coinType],
    functionArguments: [
      String(amount),
      recipient,
    ],
  };
};

export const useShieldedVault = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState(null);

  const executeTransaction = useCallback(
    async (buildPayload, params) => {
      if (!account) {
        alert('Please connect your wallet first.');
        return;
      }
      setLoading(true);
      setTxResult(null);

      try {
        const payload = await buildPayload(params);
        const response = await signAndSubmitTransaction({
          sender: account.address,
          data: payload,
        });
        await aptosClient().waitForTransaction({
          transactionHash: response.hash,
        });
        setTxResult({ success: true, hash: response.hash });
      } catch (error) {
        console.error('Transaction Error:', error);
        setTxResult({ success: false, message: error.message });
      } finally {
        setLoading(false);
      }
    },
    [account, signAndSubmitTransaction],
  );

  const initializeVault = (params) =>
    executeTransaction(buildInitializePayload, params);
  const deposit = (params) => executeTransaction(buildDepositPayload, params);
  const withdraw = (params) => executeTransaction(buildWithdrawPayload, params);
  
  const handleDeposit = async (amount, token) => {
    console.log('Depositing funds...');
    const tokenType = COINS[token]?.type;
    
    if (!amount || !tokenType) {
      toast.error('Please provide valid amount and token');
      return;
    }

    const commitmentPoint = `${toHexString(
      new TextEncoder().encode('mock_commitment_point'),
    )}`;
    const ciphertext = `${toHexString(
      new TextEncoder().encode('mock_ciphertext'),
    )}`;
    const formatedAmount = toRawAmount(amount, tokenType);
    const depositParams = {
      coinType: COINS.APT.type,
      amount: formatedAmount,
      commitmentPoint,
      ciphertext,
    };
    await deposit(depositParams);
  };

  return {
    loading,
    txResult,
    initializeVault,
    deposit,
    withdraw,
    handleDeposit
  };
};
