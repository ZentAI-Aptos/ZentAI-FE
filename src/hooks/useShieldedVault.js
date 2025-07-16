import { useState, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { aptosClient } from '../utils/aptosClient'; // Giả sử bạn có file client chung
import { VAULT_CONTRACT_ADDRESS } from 'utils/const';

// Thay thế bằng địa chỉ account đã triển khai module của bạn
// Đây là địa chỉ được đặt tên trong file Move.toml hoặc địa chỉ 0x... thực tế
// --- CÁC HÀM XÂY DỰNG PAYLOAD ---
// Mỗi hàm tương ứng với một entry function trong smart contract

/**
 * Xây dựng payload để khởi tạo vault cho một loại coin.
 */
const buildInitializePayload = async ({ coinType }) => {
  return {
    function: `${VAULT_CONTRACT_ADDRESS.packageId}::shielded_vault::initialize_vault`,
    typeArguments: [coinType],
    functionArguments: [],
  };
};

/**
 * Xây dựng payload để gửi tiền (deposit) vào vault.
 */
const buildDepositPayload = async ({ coinType, amount, commitmentPoint, ciphertext }) => {
  return {
    function: `${VAULT_CONTRACT_ADDRESS.packageId}::shielded_vault::deposit`,
    typeArguments: [coinType],
    functionArguments: [
      String(amount),          // u64
      commitmentPoint,         // vector<u8> (dạng hex string "0x...")
      ciphertext,              // vector<u8> (dạng hex string "0x...")
    ],
  };
};

/**
 * Xây dựng payload để rút tiền (withdraw) khỏi vault.
 */
const buildWithdrawPayload = async (params) => {
  const {
    coinType,
    amount,
    recipient,
    merkleRoot,
    nullifierHash,
    changeCommitmentBytes,
    changeCiphertextBytes,
    changeRangeProofBytes,
    linkingProofBytes,
  } = params;

  return {
    function: `${VAULT_CONTRACT_ADDRESS.packageId}::shielded_vault::withdraw`,
    typeArguments: [coinType],
    functionArguments: [
      String(amount),           // u64
      recipient,                // address
      merkleRoot,               // vector<u8>
      nullifierHash,            // vector<u8>
      changeCommitmentBytes,    // vector<u8>
      changeCiphertextBytes,    // vector<u8>
      changeRangeProofBytes,    // vector<u8>
      linkingProofBytes,        // vector<u8>
    ],
  };
};


// --- CUSTOM HOOK: useShieldedVault ---

export const useShieldedVault = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState(null);

  /**
   * Hàm thực thi giao dịch chung.
   * @param {function} buildPayload - Hàm để xây dựng payload cho giao dịch.
   * @param {object} params - Các tham số cần thiết cho buildPayload.
   */
  const executeTransaction = useCallback(async (buildPayload, params) => {
    if (!account) {
      alert('Please connect your wallet first.');
      return;
    }
    setLoading(true);
    setTxResult(null);

    try {
      // Xây dựng payload dựa trên hàm được cung cấp
      const payload = await buildPayload(params);

      // Ký và gửi giao dịch
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: payload,
      });
      
      // Chờ giao dịch được xác nhận trên blockchain
      await aptosClient().waitForTransaction({ transactionHash: response.hash });
      
      setTxResult({ success: true, hash: response.hash });

    } catch (error) {
      console.error('Transaction Error:', error);
      setTxResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  }, [account, signAndSubmitTransaction]);

  // Các hàm tiện ích để gọi các chức năng cụ thể của contract
  const initializeVault = (params) => executeTransaction(buildInitializePayload, params);
  const deposit = (params) => executeTransaction(buildDepositPayload, params);
  const withdraw = (params) => executeTransaction(buildWithdrawPayload, params);

  return {
    loading,
    txResult,
    initializeVault,
    deposit,
    withdraw,
  };
};