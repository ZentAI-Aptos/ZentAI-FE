import { useEffect, useRef, useState } from 'react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Box, Button, Flex, Input, useColorModeValue } from '@chakra-ui/react';
import axios from 'axios';
import Card from 'components/card/Card.js';
import ChatBubbles from 'components/chatUI/ChatBubbles';
import { useAptosRouterSwap } from 'hooks/swapRouter';
import { useWalletBalances } from 'hooks/useWalletBalances';
import { Message } from 'react-chat-ui';
import { COINS } from 'utils/const';
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
  const { account } = useWallet();

  const [messages, setMessages] = useState([
    { id: 1, message: 'Hello! How can I help you today?' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);

  const API_ENDPOINT = 'http://localhost:8000/command';

  const {
    balances: connectedWalletBalances,
    loading: balancesLoading,
    fetchExternalBalance,
  } = useWalletBalances();

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!currentInput.trim() || isLoading) return;

    const userMessage = new Message({ id: 0, message: currentInput });
    setMessages((prev) => [...prev, userMessage]);
    setCurrentInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(API_ENDPOINT, {
        command: userMessage.message,
      });
      let botReplyText = '';

      if (typeof response.data === 'object' && response.data.name) {
        const { name, arguments: args } = response.data;

        switch (name) {
          case 'transfer_money': {
            const { recipient, amount, token } = args;
            if (!recipient || !amount || !token) {
              botReplyText =
                'Please specify the recipient, amount, and token for the transfer.';
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  id: 1,
                  action: name,
                  address: recipient,
                  token: token,
                  amount: amount,
                },
              ]);
            }
            break;
          }
          case 'swap_token': {
            const { from_token, to_token, amount: swapAmount } = args;
            if (!from_token || !to_token || !swapAmount) {
              botReplyText =
                'Please specify which token you want to swap, which token you want to receive, and the amount.';
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  id: 1,
                  action: name,
                  from: from_token?.toUpperCase(),
                  to: to_token?.toUpperCase(),
                  amount: swapAmount,
                },
              ]);
            }
            break;
          }
          case 'get_token_price': {
            const { token_name } = args;
            if (!token_name) {
              botReplyText = "Which token's price would you like to know?";
            } else {
              const price = (Math.random() * 50000 + 10000).toFixed(2);
              botReplyText = `The current price of ${token_name.toUpperCase()} is $${price}.`;
            }
            break;
          }
          case 'get_balance': {
            const externalWalletAddress =
              args.wallet_address || account?.address?.toString();
            const tokenSymbol = args.token_name?.toUpperCase();

            if (!tokenSymbol) {
              botReplyText = 'Please specify the token (e.g., APT, USDT).';
            } else if (externalWalletAddress) {
              try {
                const result = await fetchExternalBalance(
                  externalWalletAddress,
                  tokenSymbol,
                );
                setMessages((prev) => [
                  ...prev,
                  {
                    id: 1,
                    action: name,
                    address: externalWalletAddress,
                    token: tokenSymbol,
                    amount: result.amount,
                  },
                ]);
              } catch (error) {
                botReplyText = error.message;
              }
            } else {
              if (!account?.address) {
                botReplyText = 'Please connect your wallet first.';
              } else if (balancesLoading) {
                botReplyText =
                  'Still fetching your wallet balances, please wait a moment...';
              } else {
                const tokenInfo = connectedWalletBalances[tokenSymbol];
                if (tokenInfo) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: 1,
                      action: name,
                      address: account.address,
                      token: tokenSymbol,
                      amount: tokenInfo.amount,
                    },
                  ]);
                } else {
                  botReplyText = `Could not find balance for token '${tokenSymbol}'. It might not be supported or you may not have any.`;
                }
              }
            }
            break;
          }
          case 'deposit_vault': {
            const { amount, token } = args;
            if (!amount || !token) {
              botReplyText =
                'Please specify the amount and token you want to deposit.';
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  id: 1,
                  action: name,
                  amount: amount,
                  token: token.toUpperCase(),
                },
              ]);
            }
            break;
          }
          default:
            botReplyText = `Recognized function '${name}', but no handler is implemented.`;
        }
      } else if (typeof response.data === 'string') {
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

  return (
    <Card
      align="center"
      direction="column"
      w="100%"
      h="calc(100vh - 160px)"
      {...rest}
      px={0}
    >
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
        <ChatBubbles messages={messages} isLoading={isLoading} />
      </Box>

      <Flex w="100%" p="10px" mt="auto">
        <Input
          placeholder="Type your message..."
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
          mr={2}
          borderRadius="100px"
        />
        <Button
          onClick={handleSend}
          isLoading={isLoading}
          colorScheme="brand"
          borderRadius="100px"
        >
          Send
        </Button>
      </Flex>
    </Card>
  );
}
