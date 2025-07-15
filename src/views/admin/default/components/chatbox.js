// Chakra imports
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Box, Button, Flex, Input, useColorModeValue } from '@chakra-ui/react';
import axios from 'axios';
import Card from 'components/card/Card.js';
import ChatBubbles from 'components/chatUI/ChatBubbles';
import { useAptosRouterSwap } from 'hooks/swapRouter';
import { useWalletBalances } from 'hooks/useWalletBalances';
import { useEffect, useRef, useState } from 'react';
import { Message } from 'react-chat-ui';
import { COINS } from 'utils/const';

const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);

export default function ChatBox(props) {
  const { ...rest } = props;
  const { connect, disconnect, account, network, isConnected, connected } =
    useWallet();

  const [messages, setMessages] = useState([
    { id: 1, message: 'Hello! How can I help you today?' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);

  const API_ENDPOINT = 'http://localhost:8000/command';

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Hook to automatically fetch balances for the connected wallet
  const {
    balances: connectedWalletBalances,
    loading: balancesLoading,
    fetchExternalBalance,
  } = useWalletBalances();

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

      if (typeof response.data === 'object' && response.data.name) {
        const { name, arguments: args } = response.data;

        const formattedFunction = `Function Call:\n${JSON.stringify(
          response.data,
          null,
          2,
        )}`;
        // setMessages((prev) => [
        //   ...prev,
        //   new Message({ id: 1, message: formattedFunction, isCode: true }),
        // ]);

        switch (name) {
          case 'transfer_money':
            const { recipient, amount, token } = args;
            if (!recipient || !amount || !token) {
              botReplyText =
                'I can help with that. Please specify the recipient, amount, and token for the transfer.';
            } else {
              // const confirmMsg = `Do you want to transfer ${amount} ${token} to ${recipient}?`;
              // if (window.confirm(confirmMsg)) {
              //   botReplyText = `Action Confirmed: Transferring ${amount} ${token} to ${recipient}.`;
              // } else {
              //   botReplyText = 'Transfer cancelled by user.';
              // }
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
            const externalWalletAddress =
              args.wallet_address || account?.address?.toString();
            const tokenSymbol = args.token_name?.toUpperCase();

            if (!tokenSymbol) {
              botReplyText =
                'I can check a balance for you. Please specify the token (e.g., APT, USDT).';
            } else if (externalWalletAddress) {
              // Handle external wallet check
              const shortAddress = `${externalWalletAddress.slice(
                0,
                6,
              )}...${externalWalletAddress.slice(-4)}`;
              try {
                const result = await fetchExternalBalance(
                  externalWalletAddress,
                  tokenSymbol,
                );
                console.log(
                  `Fetched external balance for ${tokenSymbol}:`,
                  result,
                );

                // botReplyText = `The balance of ${tokenSymbol} for wallet ${shortAddress} is ${result.amount.toFixed(
                //   4,
                // )}.`;
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
              // Handle connected wallet check
              if (!account?.address) {
                botReplyText = 'Please connect your wallet first.';
              } else if (balancesLoading) {
                botReplyText =
                  'Still fetching your wallet balances, please wait a moment...';
              } else {
                const tokenInfo = connectedWalletBalances[tokenSymbol];
                if (tokenInfo) {
                  const shortAddress = `${account.address.slice(
                    0,
                    6,
                  )}...${account.address.slice(-4)}`;
                  // botReplyText = `The balance of ${tokenSymbol} for your wallet ${shortAddress} is ${tokenInfo.amount.toFixed(
                  //   4,
                  // )}.`;
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: 1,
                      action: name,
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

          default:
            botReplyText = `Recognized function '${name}', but no handler is implemented.`;
            break;
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

  const {
    loading: loadingSwap,
    txResult,
    swapOnPancake,
    swapOnLiquid,
  } = useAptosRouterSwap();

  useEffect(() => {
    console.log(connectedWalletBalances, 'balancesbalances');
  }, [connectedWalletBalances]);

  const handlePancakeSubmit = () => {
    swapOnPancake({
      coinIn: COINS.APT.type,
      coinOut: COINS.USDT.type,
      amountIn: 0.05,
    });
  };

  const handleLiquidSubmit = () => {
    // Corrected to call swapOnLiquid and pass correct parameters
    swapOnLiquid({
      coinIn: COINS.APT.type,
      coinOut: COINS.USDT.type,
      amountIn: 0.05,
      minAmountOut: 0, // In a real app, you'd calculate this
    });
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
