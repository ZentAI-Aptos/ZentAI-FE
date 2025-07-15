import React, { useState } from 'react';
import { Box, Text, Flex, useColorModeValue, Button } from '@chakra-ui/react';
import { addressShortener } from 'utils';
import { roundDown } from 'utils';
import { useAptosTransfer } from 'hooks/transferToken';
import toast from 'react-hot-toast';
import AddressCopier from 'components/addresscopier';

const BotMessageRender = ({ msg }) => {
  const [actionStatus, setActionStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const userBg = useColorModeValue('blue.500', 'blue.400');
  const botBg = useColorModeValue('gray.200', 'gray.700');
  const userColor = 'white';
  const botColor = useColorModeValue('gray.800', 'white');
  const { transfer } = useAptosTransfer();

  if (msg?.action == 'get_balance')
    return (
      <Flex
        sx={{
          flexDirection: 'column',
          alignItems: 'flex-start',
          minW: '320px',
          boxShadow: '1px 2px 8px rgba(0, 0, 0, 0.12)',
          alignSelf: 'flex-start',
          borderRadius: '8px',
          px: '8px',
          py: '8px',
          // mx: "20px"
        }}
      >
        <Text>Balance</Text>
        <Flex
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text>{addressShortener(msg?.address)}</Text>
          <Flex gap="4px">
            <Text fontWeight="bold">{roundDown(msg?.amount, 4)}</Text>
            <Text fontWeight="bold">{msg?.token}</Text>
          </Flex>
        </Flex>
      </Flex>
    );
  if (msg?.action == 'transfer_money')
    return (
      <Flex
        sx={{
          minW: '320px',
          flexDirection: 'column',
          alignSelf: 'flex-start',
        }}
      >
        <Flex
          sx={{
            flexDirection: 'column',
            boxShadow: '1px 2px 8px rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
            px: '12px',
            py: '12px',
            w: '100%',
            alignItems: 'flex-start',
          }}
        >
          <Flex
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Text fontWeight="bold">Transfer</Text>
            {actionStatus === 'pending' ? (
              <Text color="orange.500">Pending</Text>
            ) : actionStatus === 'confirmed' ? (
              <Text color="green.500">Confirmed</Text>
            ) : (
              <Text color="gray.500">Canceled</Text>
            )}
          </Flex>
          <Flex
            sx={{
              justifyContent: 'space-between',
              width: '100%',
              mt: '16px',
            }}
            align="flex-end"
          >
            <Flex align="flex-end" gap="4px">
              <Text>to</Text>
              <AddressCopier address={msg?.address} />
            </Flex>
            <Flex align="flex-end" gap="4px">
              <Text fontWeight="bold">{roundDown(msg?.amount, 4)}</Text>
              <Text fontWeight="bold">{msg?.token}</Text>
            </Flex>
          </Flex>
        </Flex>
        {actionStatus === 'pending' && (
          <Flex mt="8px" gap="4px">
            <Button
              borderRadius="8px"
              w="100%"
              variant="outline"
              colorScheme="brand"
              onClick={() => setActionStatus('canceled')}
              isDisabled={loading}
            >
              Cancel
            </Button>
            <Button
              borderRadius="8px"
              w="100%"
              variant="solid"
              colorScheme="brand"
              onClick={async () => {
                setLoading(true);
                try {
                  await transfer(msg?.address, msg?.amount, msg?.token);
                  setActionStatus('confirmed');
                  toast.success('Transfer successful!');
                } catch (e) {
                  if (e?.message) toast.error(e.message);
                  setActionStatus('pending');
                } finally {
                  setLoading(false);
                }
              }}
              isLoading={loading}
            >
              Confirm
            </Button>
          </Flex>
        )}
      </Flex>
    );
  if (msg?.action == 'swap_token')
    return (
      <Flex
        sx={{
          minW: '320px',
          flexDirection: 'column',
          alignSelf: 'flex-start',
        }}
      >
        <Flex
          sx={{
            flexDirection: 'column',
            boxShadow: '1px 2px 8px rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
            px: '12px',
            py: '12px',
            w: '100%',
            alignItems: 'flex-start',
          }}
        >
          <Flex
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Text fontWeight="bold">Swap token</Text>
            {actionStatus === 'pending' ? (
              <Text color="orange.500">Pending</Text>
            ) : actionStatus === 'confirmed' ? (
              <Text color="green.500">Confirmed</Text>
            ) : (
              <Text color="gray.500">Canceled</Text>
            )}
          </Flex>
          <Flex
            sx={{
              justifyContent: 'space-between',
              width: '100%',
              mt: '16px',
            }}
            align="flex-end"
          >
            <Flex align="flex-end" gap="4px">
              <Text fontWeight="bold">{msg?.amount} {msg?.from}</Text>
            </Flex>
            <Flex align="flex-end" gap="4px">
              <Text fontWeight="bold">{msg?.to}</Text>
            </Flex>
          </Flex>
        </Flex>
        {actionStatus === 'pending' && (
          <Flex mt="8px" gap="4px">
            <Button
              borderRadius="8px"
              w="100%"
              variant="outline"
              colorScheme="brand"
              onClick={() => setActionStatus('canceled')}
              isDisabled={loading}
            >
              Cancel
            </Button>
            <Button
              borderRadius="8px"
              w="100%"
              variant="solid"
              colorScheme="brand"
              onClick={async () => {
                setLoading(true);
                try {
                  await transfer(msg?.address, msg?.amount, msg?.token);
                  setActionStatus('confirmed');
                  toast.success('Transfer successful!');
                } catch (e) {
                  if (e?.message) toast.error(e.message);
                  setActionStatus('pending');
                } finally {
                  setLoading(false);
                }
              }}
              isLoading={loading}
            >
              Confirm
            </Button>
          </Flex>
        )}
      </Flex>
    );
  return (
    <Flex justify={msg.id === 0 ? 'flex-end' : 'flex-start'} align="flex-end">
      <Box
        px="12px"
        py="8px"
        bg={msg.id === 0 ? userBg : botBg}
        color={msg.id === 0 ? userColor : botColor}
        borderRadius="8px"
        maxW="75%"
        fontSize="md"
        // boxShadow="md"
        wordBreak="break-word"
      >
        <Text textAlign="left" whiteSpace="pre-line">
          {msg.message}
        </Text>
      </Box>
    </Flex>
  );
};

export default function ChatBubbles({ messages, isLoading }) {
  const userBg = useColorModeValue('blue.500', 'blue.400');
  const botBg = useColorModeValue('gray.200', 'gray.700');
  const userColor = 'white';
  const botColor = useColorModeValue('gray.800', 'white');

  return (
    <Flex direction="column" gap={3} py={3} px="20px">
      {messages.map((msg, idx) => (
        <BotMessageRender key={idx} msg={msg} />
      ))}
      {isLoading && (
        <Flex justify="flex-start" align="center" pl={2}>
          <Box
            bg={botBg}
            color={botColor}
            borderRadius="2xl"
            px={4}
            py={2}
            fontSize="md"
            maxW="60%"
            boxShadow="md"
          >
            <Text>...</Text>
          </Box>
        </Flex>
      )}
    </Flex>
  );
}
