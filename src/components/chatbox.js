import { useEffect, useRef, useState } from 'react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import {
  Box,
  Button,
  Flex,
  Image,
  Input,
  useColorModeValue,
} from '@chakra-ui/react';
import axios from 'axios';
import Card from 'components/card/Card.js';
import ChatBubbles from 'components/chatUI/ChatBubbles';
import { useAptosRouterSwap } from 'hooks/swapRouter';
import { useWalletBalances } from 'hooks/useWalletBalances';
import { Message } from 'react-chat-ui';
import { COINS } from 'utils/const';
import { useShieldedVault } from 'hooks/useShieldedVault';
import { useMutation, useQuery } from 'react-query';
import toast from 'react-hot-toast';

const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);

const TOKEN_MAP = {
  APT: '0x1::aptos_coin::AptosCoin',
  USDT: '0x123...::usdt::USDT',
  USDC: '0x456...::usdc::USDC',
};

export default function ChatBox(props) {
  const { ...rest } = props;
  const { account } = useWallet();
  const [chatid, setChatId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const chatContainerRef = useRef(null);

  const API_ENDPOINT = 'http://localhost:8000/command';

  const {
    balances: connectedWalletBalances,
    loading: balancesLoading,
    fetchExternalBalance,
  } = useWalletBalances();

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  const initChatMutation = useMutation(async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/conversations/init`,
        {
          userId: account?.address?.toString(),
        },
      );

      setChatId(response.data._id);
      setMessages((prev) => [
        ...prev,
        { id: 1, message: 'Hello, how can I assist you today?' },
      ]);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setMessages([
        {
          id: 1,
          message: 'Failed to initialize chat. Please try again later.',
        },
      ]);
    }
  });

  const sendMessageMutation = useMutation(async (message) => {
    if (!currentInput.trim()) return;

    const userMessage = new Message({ id: 0, message: currentInput });
    setMessages((prev) => [...prev, userMessage]);
    setCurrentInput('');
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/chat`,
        {
          userId: account?.address?.toString(),
          command: userMessage.message,
          chatid: chatid,
        },
      );
      const { type, payload } = response.data;
      let botReplyText = '';

      if (type === 'command') {
        const action = payload.action;
        switch (action) {
          case 'transfer_money':
            if (payload.message) {
              botReplyText = payload.message;
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  id: 1,
                  action,
                  address: payload.address,
                  token: payload.token,
                  amount: payload.amount,
                  transactionId: payload.transactionId,
                  status: payload.status,
                },
              ]);
            }
            break;
          case 'swap_token':
            if (payload.message) {
              botReplyText = payload.message;
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  id: 1,
                  action,
                  from: payload.from,
                  to: payload.to,
                  amount: payload.amount,
                  transactionId: payload.transactionId,
                  status: payload.status,
                },
              ]);
            }
            break;
          case 'get_token_price':
            botReplyText = payload.message;
            break;
          case 'get_balance':
            console.log(payload);
            const externalWalletAddress =
              payload.address || account?.address?.toString();
            const tokenSymbol = payload.token?.toUpperCase();
            if (!tokenSymbol) {
              botReplyText =
                'I can check a balance for you. Please specify the token (e.g., APT, USDT).';
            } else if (externalWalletAddress) {
              try {
                const result = await fetchExternalBalance(
                  externalWalletAddress,
                  tokenSymbol,
                );
                console.log(
                  `Fetched external balance for ${tokenSymbol}:`,
                  result,
                );

                setMessages((prev) => [
                  ...prev,
                  {
                    id: 1,
                    action: payload?.action,
                    address: externalWalletAddress,
                    token: tokenSymbol,
                    amount: result.amount,
                  },
                ]);
              } catch (error) {
                botReplyText = error.message;
              }
            } else {
              // Handle connected wallet check
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
                      action: payload?.action,
                      address: externalWalletAddress,
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
          case 'deposit_vault':
          case 'withdraw_vault':
            if (payload.message) {
              botReplyText = payload.message;
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  id: 1,
                  action,
                  amount: payload.amount,
                  token: payload.token,
                  transactionId: payload.transactionId,
                  status: payload.status,
                },
              ]);
            }
            break;
          default:
            botReplyText =
              payload.message ||
              `Recognized function '${action}', but no handler is implemented.`;
        }
      } else if (type === 'text') {
        botReplyText = payload.message;
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
    }
  });

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
        display="flex"
      >
        {!chatid && (
          <Flex flex={1} justify="center" align="center" direction="column">
            <Image
              src="/assets/logo.png"
              alt="Chatbot"
              boxSize="150px"
              mb={4}
            />
          </Flex>
        )}
        {chatid && (
          <ChatBubbles
            messages={messages}
            isLoading={sendMessageMutation.isLoading}
          />
        )}
      </Box>

      <Flex w="100%" p="10px" mt="auto">
        <Input
          placeholder="Type your message..."
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessageMutation.mutate()}
          disabled={!chatid || sendMessageMutation.isLoading}
          mr={2}
          borderRadius="100px"
        />

        {chatid ? (
          <Button
            onClick={() => sendMessageMutation.mutate()}
            isLoading={sendMessageMutation.isLoading}
            colorScheme="brand"
            borderRadius="100px"
          >
            Send
          </Button>
        ) : (
          <Button
            colorScheme="brand"
            borderRadius="100px"
            px="20px"
            isLoading={initChatMutation.isLoading}
            onClick={() => {
              initChatMutation.mutate();
            }}
          >
            Start Chat
          </Button>
        )}
      </Flex>
    </Card>
  );
}
