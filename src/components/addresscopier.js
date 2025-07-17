import React from 'react';
import {
  Flex,
  Text,
  IconButton,
  useClipboard,
  useToast,
} from '@chakra-ui/react';
import { CopyIcon, CheckIcon } from '@chakra-ui/icons';
import { addressShortener } from 'utils';
import { isValidHexAddress } from 'utils';

const AddressCopier = ({ address, digits = 5, ...rest }) => {
  const toast = useToast();
  const { hasCopied, onCopy } = useClipboard(address);

  const handleCopy = () => {
    onCopy();
    toast({
      title: 'Copied!',
      description: 'Address copied to clipboard.',
      status: 'success',
      duration: 1200,
      isClosable: true,
      position: 'top-right',
    });
  };

  if (!address) return null;
  if (!isValidHexAddress(address)) return address;
  return (
    <Flex align="flex-end">
      <Text {...rest}>{addressShortener(address, digits)}</Text>
      <IconButton
        mb="-4px"
        ml={0}
        aria-label="Copy address"
        icon={hasCopied ? <CheckIcon /> : <CopyIcon />}
        size="sm"
        variant="ghost"
        colorScheme="blue"
        onClick={handleCopy}
      />
    </Flex>
  );
};

export default AddressCopier;
