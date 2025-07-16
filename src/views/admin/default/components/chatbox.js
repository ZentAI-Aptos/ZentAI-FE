// Chakra imports
import {
  Box,
  Button,
  Flex,
  Input,
  useColorModeValue,
  Spinner,
  Center,
} from '@chakra-ui/react';
import Card from 'components/card/Card.js';
import React, { useState, useEffect, useRef } from 'react';
import { ChatFeed, Message } from 'react-chat-ui';
import axios from 'axios';
import { useWallet } from '@aptos-labs/wallet-adapter-react'; // Import useWallet
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useAptosRouterSwap } from 'hooks/swapRouter';
import { COINS } from 'utils/const';
import { useWalletBalances } from 'hooks/useWalletBalances';
import { useShieldedVault } from 'hooks/useShieldedVault';

const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);

const TOKEN_MAP = {
  APT: '0x1::aptos_coin::AptosCoin',
  USDT: '0x123...::usdt::USDT', // Example: Replace with actual testnet USDT address
  USDC: '0x456...::usdc::USDC', // Example: Replace with actual testnet USDC address
};

export default function ChatBox(props) {
  const { ...rest } = props;
  const { connect, disconnect, account, network, isConnected, connected } =
    useWallet();

  // --- Component State & Hooks ---
  const [messages, setMessages] = useState([
    new Message({ id: 1, message: 'Hello! How can I help you today?' }),
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);

  // --- API Endpoint ---
  const API_ENDPOINT = 'http://localhost:8000/command'; // Replace if needed

  // Auto-scroll effect
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const codeBgColor = useColorModeValue('gray.100', 'gray.700');
  const chatBubbleTextColor = useColorModeValue('navy.700', 'white');

  // --- Main function to handle sending messages and API calls ---
  const handleSend = async () => {
    if (currentInput.trim() === '' || isLoading) return;

    const userMessageText = currentInput;
    const userMessage = new Message({ id: 0, message: userMessageText });

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setCurrentInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(API_ENDPOINT, {
        command: userMessageText,
      });

      let botReplyText = '';

      // --- Response Handling Logic ---
      if (typeof response.data === 'object' && response.data.name) {
        // --- COMMAND MODE ---
        const { name, arguments: args } = response.data;

        const formattedFunction = `Function Call:\n${JSON.stringify(
          response.data,
          null,
          2,
        )}`;
        setMessages((prev) => [
          ...prev,
          new Message({ id: 1, message: formattedFunction, isCode: true }),
        ]);

        switch (name) {
          case 'transfer_money':
            const { recipient, amount, token } = args;
            if (!recipient || !amount || !token) {
              botReplyText =
                'I can help with that. Please specify the recipient, amount, and token for the transfer.';
            } else {
              const confirmMsg = `Do you want to transfer ${amount} ${token} to ${recipient}?`;
              if (window.confirm(confirmMsg)) {
                botReplyText = `Action Confirmed: Transferring ${amount} ${token} to ${recipient}.`;
              } else {
                botReplyText = 'Transfer cancelled by user.';
              }
            }
            break;

          case 'swap_token':
            const { from_token, to_token, amount: swapAmount } = args;
            if (!from_token || !to_token || !swapAmount) {
              botReplyText =
                'I can help with that. Please specify which token you want to swap, which token you want to receive, and the amount.';
            } else {
              const confirmSwapMsg = `Do you want to swap ${swapAmount} ${from_token} for ${to_token}?`;
              if (window.confirm(confirmSwapMsg)) {
                botReplyText = `Action Confirmed: Swapping ${swapAmount} ${from_token} for ${to_token}.`;
              } else {
                botReplyText = 'Swap cancelled by user.';
              }
            }
            break;

          case 'get_token_price':
            const { token_name } = args;
            if (!token_name) {
              botReplyText = "Which token's price would you like to know?";
            } else {
              const price = (Math.random() * 50000 + 10000).toFixed(2);
              botReplyText = `The current price of ${token_name.toUpperCase()} is $${price}.`;
            }
            break;

          case 'get_balance':
            // Ưu tiên lấy địa chỉ ví từ lệnh người dùng.
            // Nếu không có, nó sẽ tự động dùng địa chỉ ví đang kết nối (`account?.address`).
            const wallet = args.wallet_address || account?.address;
            const tokenSymbol = args.token_name?.toUpperCase();
            const tokenAddress = TOKEN_MAP[tokenSymbol];

            if (!tokenSymbol) {
              // Yêu cầu tên token nếu thiếu
              botReplyText =
                'I can check a balance for you. Please specify the token (e.g., APT, USDT).';
            } else if (!tokenAddress) {
              // Xử lý nếu tên token không được nhận dạng
              botReplyText = `Sorry, I don't recognize the token '${tokenSymbol}'.`;
            } else if (!wallet) {
              // Yêu cầu kết nối ví nếu không có địa chỉ nào khả dụng
              botReplyText =
                'Please connect your wallet or provide a wallet address to check the balance.';
            } else {
              try {
                // Logic gọi blockchain để lấy số dư thực tế
                const resource = await aptos.getAccountResource({
                  accountAddress: wallet,
                  resourceType: `0x1::coin::CoinStore<${tokenAddress}>`,
                });

                const decimals = tokenSymbol === 'APT' ? 8 : 6; // Giả sử các token khác có 6 số thập phân
                const balance =
                  parseInt(resource.coin.value) / Math.pow(10, decimals);

                const shortAddress = `${wallet.slice(0, 6)}...${wallet.slice(
                  -4,
                )}`;
                botReplyText = `The balance of ${tokenSymbol} for wallet ${shortAddress} is ${balance.toFixed(
                  4,
                )}.`;
              } catch (e) {
                if (e.status === 404) {
                  botReplyText = `The wallet does not hold any ${tokenSymbol}.`;
                } else {
                  console.error('Blockchain Error:', e);
                  botReplyText =
                    "Sorry, I couldn't fetch the balance from the blockchain.";
                }
              }
            }
            break;

          default:
            botReplyText = `Recognized function '${name}', but no handler is implemented.`;
            break;
        }
      } else if (typeof response.data === 'string') {
        // --- CHAT MODE ---
        botReplyText = response.data;
      } else {
        botReplyText =
          'Sorry, I received an unexpected response from the server.';
      }

      if (botReplyText) {
        setMessages((prev) => [
          ...prev,
          new Message({ id: 1, message: botReplyText }),
        ]);
      }
    } catch (error) {
      console.error('API Error:', error);
      const errorMsg =
        error.response?.data?.detail ||
        'Sorry, an error occurred. Please try again later.';
      setMessages((prev) => [
        ...prev,
        new Message({ id: 1, message: errorMsg }),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const customBubbleStyles = (isCode) => ({
    text: {
      fontSize: 16,
      whiteSpace: isCode ? 'pre-wrap' : 'normal',
      fontFamily: isCode ? 'monospace' : 'inherit',
      backgroundColor: isCode ? codeBgColor : 'transparent',
      color: chatBubbleTextColor,
      padding: isCode ? '10px' : '0',
      borderRadius: isCode ? '8px' : '0',
    },
    chatbubble: {
      borderRadius: 20,
      padding: 10,
      maxWidth: '80%',
    },
  });
  const {
    loading: loadingSwap,
    txResult,
    swapOnPancake,
    swapOnLiquid,
  } = useAptosRouterSwap();
  const {
    balances,
    loading: balancesLoading,
    fetchBalances,
  } = useWalletBalances();

  useEffect(() => {
    console.log(balances, 'balancesbalances');
  }, [balances]);

  const handlePancakeSubmit = () => {
    console.log(COINS.APT, 'COINS.APT');

    swapOnPancake({
      coinIn: COINS.APT.type,
      coinOut: COINS.USDT.type,
      amountIn: 0.05,
    });
  };

  const handleLiquidSubmit = () => {
    swapOnPancake({
      coinIn: COINS.APT,
      coinOut: COINS.USDT,
      amountIn: 0.05,
    });
  };

  const toHexString = (bytes) =>
    bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

  const { loading, deposit, withdraw } = useShieldedVault();

  const handleDeposit = async () => {
    console.log("Depositing funds...");
    
    // 1. Generate cryptographic data off-chain
    const amount = 100000000; // 1 APT
    const commitmentPoint = `${toHexString(new TextEncoder().encode('mock_commitment_point'))}`;
    const ciphertext = `${toHexString(new TextEncoder().encode('mock_ciphertext'))}`;

    // 2. Call the contract with the generated data
    const depositParams = {
      coinType: COINS.APT.type,
      amount,
      commitmentPoint,
      ciphertext,
    };
    await deposit(depositParams);
  };

  const handleWithdraw = async () => {
    console.log("Withdrawing funds...");
     
    // 1. Define transaction parameters
    const amountToWithdraw = 50000000; // 0.5 APT
    const recipient = '0x_some_address';

    // 2. Fetch the user's private note and its Merkle proof from local storage/state
    const inputNote = { value: 100000000, blindingFactor: '...' }; // User must track their notes

    // 3. Generate all required proofs off-chain
  
    // 4. Call the contract with the generated proofs
    const withdrawParams = {
      coinType: COINS.APT.type,
      amount: amountToWithdraw,
      recipient,
    };
    await withdraw(withdrawParams);
  };

  return (
    <Card align="center" direction="column" w="100%" h="600px" {...rest}>
      <Box
        ref={chatContainerRef}
        w="100%"
        h="calc(100% - 60px)"
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { width: '6px' },
          '&::-webkit-scrollbar-thumb': {
            background: useColorModeValue('gray.300', 'gray.600'),
            borderRadius: '24px',
          },
        }}
      >
        <ChatFeed
          messages={messages.map((msg) => ({
            ...msg,
            styles: customBubbleStyles(msg.isCode),
          }))}
          isTyping={isLoading}
          hasInputField={false}
          showSenderName
          bubblesCentered={false}
        />
      </Box>

      <Flex w="100%" p="10px" mt="auto">
        <Input
          placeholder="Type your message..."
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
          mr={2}
        />
        <Button onClick={handleSend} isLoading={isLoading} colorScheme="brand">
          Send
        </Button>
      </Flex>
      <Button
        type="submit"
        disabled={isLoading || !connected}
        onClick={handlePancakeSubmit}
        className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        Swap trên PancakeSwap
      </Button>
      <Button
        type="submit"
        disabled={isLoading || !connected}
        onClick={handleDeposit}
        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        deposit
      </Button>
    </Card>
  );
}
