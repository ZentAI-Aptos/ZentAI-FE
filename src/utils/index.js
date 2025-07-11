import { formatUnits, parseUnits } from 'ethers';
import toast from 'react-hot-toast';

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
