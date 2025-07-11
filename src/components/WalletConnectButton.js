import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  VStack,
  Text,
  Image,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Box,
} from '@chakra-ui/react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { addressShortener } from 'utils';

const WalletConnectButton = () => {
  const navigate = useNavigate();
  // useDisclosure is a Chakra hook to manage modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { connect, disconnect, account, wallets, connected, wallet } =
    useWallet();

  if (connected && account) {
    const addressString = account.address.toString();
    return (
      <Menu>
        <MenuButton as={Button} variant="outline">
          {addressShortener(addressString)}
        </MenuButton>
        <MenuList>
          <Box px="3" py="2">
            <Text fontWeight="bold">Connected Wallet</Text>
            <HStack>
              <Image
                boxSize="24px"
                src={wallet?.icon}
                alt={`${wallet?.name} icon`}
                borderRadius="full"
              />
              <Text>{wallet?.name}</Text>
            </HStack>
          </Box>
          <MenuItem onClick={disconnect}>Disconnect</MenuItem>
        </MenuList>
      </Menu>
    );
  }

  // When not connected, display a Connect button and a Modal to select a wallet
  return (
    <>
      <Button variant="brand" onClick={onOpen}>
        Connect Wallet
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select a Wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} my={4}>
              {wallets.map((walletPlugin) => (
                <Button
                  key={walletPlugin.name}
                  onClick={() => {
                    connect(walletPlugin.name);
                    onClose();
                  }}
                  w="100%"
                  size="lg"
                  py={6}
                  variant="outline"
                  isDisabled={walletPlugin.readyState !== 'Installed'}
                  leftIcon={
                    <Image
                      boxSize="28px"
                      src={walletPlugin.icon}
                      alt={`${walletPlugin.name} icon`}
                    />
                  }
                  justifyContent="flex-start"
                >
                  {walletPlugin.name}
                </Button>
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default WalletConnectButton;
