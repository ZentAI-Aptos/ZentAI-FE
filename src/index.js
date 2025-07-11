import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './assets/css/App.css';
import { PetraWallet } from 'petra-plugin-wallet-adapter';

import { toast, Toaster } from 'react-hot-toast';
import App from './App';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';

const wallets = [
  new PetraWallet(),
  // , new PontemWallet(), new MartianWallet()
];

const root = ReactDOM.createRoot(document.getElementById('root'));
const NETWORK = 'testnet'; // or 'mainnet'
root.render(
  <>
    <AptosWalletAdapterProvider
      // plugins={wallets}
      // optInWallets={wallets}
      autoConnect={true}
      dappConfig={{ network: NETWORK }}
      onError={(error) => {
        // toast({
        //   variant: 'destructive',
        //   title: 'Error',
        //   description: error || 'Unknown wallet error',
        // });
        console.error('Wallet error:', error);
        toast.error(error.message || 'Unknown wallet error');
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AptosWalletAdapterProvider>{' '}
    <Toaster />
  </>,
);
