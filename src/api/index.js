import axios from 'axios';

const ENTRY_POINT = process.env.REACT_APP_API_URL;
const CHAT_SERVER_URL = process.env.REACT_APP_CHAT_SERVER_URL;

export const fetchData = async (endpoint, token = null) => {
  try {
    const response = await axios.get(`${ENTRY_POINT}/${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  } catch (error) {
    console.error('GET error:', error);
    throw error;
  }
};

export const postData = async (endpoint, payload, token = null) => {
  try {
    const response = await axios.post(`${ENTRY_POINT}/${endpoint}`, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  } catch (error) {
    console.error('POST error:', error);
    throw error;
  }
};
export const updateTransactionStatus = async (
  transactionId,
  status,
  txHash = null,
) => {
  try {
    await axios.post(
      `${ENTRY_POINT}/api/transactions/${transactionId}/update`,
      {
        status,
        txHash,
      },
    );
  } catch (e) {
    console.error('Update transaction failed:', e);
  }
};
