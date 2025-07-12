import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { aptosClient } from 'utils/aptosClient';
import { COINS } from 'utils/const';

export const useWalletBalances = () => {
    const { account } = useWallet();
    const [balances, setBalances] = useState({});
    const [loading, setLoading] = useState(false);

    const fetchBalances = useCallback(async () => {
        if (!account?.address) return;
        setLoading(true);
        try {
            // Lặp qua danh sách các coin đã được định nghĩa trước
            const balancePromises = Object.values(COINS).map(async (coin) => {
                try {
                    // Gọi trực tiếp hàm 0x1::coin::balance bằng aptos.view
                    const [balanceStr] = await aptosClient().view({
                        payload: {
                            function: "0x1::coin::balance",
                            typeArguments: [coin.type],
                            functionArguments: [account.address],
                        },
                    });
                    
                    const rawAmount = parseInt(balanceStr, 10);
                    return {
                        symbol: coin.symbol,
                        name: coin.symbol, // Sử dụng symbol làm tên
                        amount: rawAmount / (10 ** coin.decimals),
                        decimals: coin.decimals,
                        type: coin.type,
                    };
                } catch (e) {
                    // Lỗi này thường có nghĩa là người dùng chưa có CoinStore cho loại coin này.
                    // Chúng ta có thể giả định số dư là 0 một cách an toàn.
                    console.warn(`Could not fetch balance for ${coin.symbol}. User may not have a coin store.`);
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
            setBalances(results);
        } catch (error) {
            console.error("Lỗi khi lấy số dư:", error);
            setBalances([]);
        } finally {
            setLoading(false);
        }
    }, [account?.address]);

    useEffect(() => {
        fetchBalances();
    }, [fetchBalances]);

    return { balances, loading, fetchBalances };
};