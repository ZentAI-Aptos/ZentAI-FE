import { formatUnits, parseUnits } from 'ethers';
import toast from 'react-hot-toast';
import { COINS } from './const';
export const isValidHexAddress = (addr = '', length = 64) => {
  if (typeof addr !== 'string') return false;
  // Check format 0x + hex
  if (!addr.startsWith('0x')) return false;
  const hex = addr.slice(2);
  return /^[0-9a-fA-F]+$/.test(hex) && hex.length === length;
};
export const addressShortener = (addr = '', digits = 5) => {
  digits = 2 * digits >= addr.length ? addr.length : digits;
  return `${addr.substring(0, digits)}...${addr.slice(-digits)}`;
};

export const formatNumToBNEther = (number = 0, decimal = 6) => {
  try {
    return parseUnits(number?.toString(), decimal).toString();
  } catch (error) {
    console.log('error message', error.message);
    toast.error('error format number');
  }
};

export const roundUp = (v, n = 4) =>
  Math.ceil(v * Math.pow(10, n)) / Math.pow(10, n);

export const roundDown = (number, decimals = 4) =>
  Math.floor(number * Math.pow(10, decimals)) / Math.pow(10, decimals);

export const isAptosAddress = (addr) => {
  if (typeof addr !== 'string') return false;
  const re = /^(0x)?[0-9a-fA-F]{1,64}$/;
  return re.test(addr);
};
export const toHexString = (bytes) =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
export const toRawAmount = (amount, coinType) => {
  const coin = Object.values(COINS).find((c) => c.type === coinType);
  if (!coin) throw new Error('Unknown coin type');
  return Math.floor(parseFloat(amount) * Math.pow(10, coin.decimals));
};
