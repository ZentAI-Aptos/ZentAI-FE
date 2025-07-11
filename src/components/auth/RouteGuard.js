import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Center, Spinner } from '@chakra-ui/react';

const PUBLIC_ROUTE_PREFIXES = ['/auth'];

const RouteGuard = () => {
  const { connected, isLoading } = useWallet();
  const { pathname } = useLocation();

  const isPublicRoute = PUBLIC_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isLoading) {
    return (
      <Center height="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (isPublicRoute) {
    return <Outlet />;
  }

  if (!isPublicRoute && connected) {
    return <Outlet />;
  }

  return <Navigate to="/auth/sign-in" replace />;
};

export default RouteGuard;
