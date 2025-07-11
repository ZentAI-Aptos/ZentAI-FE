import React from 'react';
import { Navigate } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Box, Spinner, Center } from '@chakra-ui/react';

const RootRedirect = () => {
  const { connected, isLoading } = useWallet();

  if (isLoading) {
    return (
      <Center height="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (connected) {
    return <Navigate to="/admin/default" replace />;
  }

  return <Navigate to="/auth/sign-in" replace />;
};

export default RootRedirect;
