// Chakra imports
import {
  Box,
  Button,
  Flex,
  Icon,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Card from "components/card/Card.js";
// Custom components
import BarChart from "components/charts/BarChart";
import React, { useEffect, useRef, useState } from "react";
import {
  barChartDataConsumption,
  barChartOptionsConsumption,
} from "variables/charts";
import { MdBarChart } from "react-icons/md";
import { ChatFeed, Message } from "react-chat-ui";
import axios from "axios";
import { useWallet,  } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-react";
import WalletConnectButton from "components/WalletConnectButton";

export default function ChatBox(props) {
  const { ...rest } = props;
  const { connect, disconnect, account, network, isConnected, connected } = useWallet();

  // Chakra Color Mode
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const iconColor = useColorModeValue("brand.500", "white");
  const bgButton = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const bgHover = useColorModeValue(
    { bg: "secondaryGray.400" },
    { bg: "whiteAlpha.50" }
  );
  const bgFocus = useColorModeValue(
    { bg: "secondaryGray.300" },
    { bg: "whiteAlpha.100" }
  );

  const [messages, setMessages] = useState([
    new Message({ id: 1, message: "Hello! How can I help you?" }),
    new Message({ id: 0, message: "Hi! I have a question." }),
  ]);
  const [currentInput, setCurrentInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (currentInput.trim() === "" || loading) return;
    const userMessage = currentInput;
    setMessages([...messages, new Message({ id: 0, message: userMessage })]);
    setCurrentInput("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/command", {
        command: userMessage,
      });

      // Xử lý phản hồi API (bot trả về)
      let botReply = "";
      if (response.data.name) {
        // Nếu là JSON function, format lại cho dễ đọc
        // sample data { "name": "transfer_money", "arguments": { "recipient": "Huy", "amount": 100000, "token": "USD" } }
        botReply = "Function call: " + JSON.stringify(response.data, null, 2);
        switch (response.data.name) {
          case "transfer_money":
            const { recipient, amount, token } = response?.data?.arguments;
            const confirmMsg = `Do you want to transfer ${amount} ${token} to ${recipient}?`;
            if (window.confirm(confirmMsg)) {
              // Call API to confirm transfer (example endpoint)
              try {
                // const transferRes = await axios.post("http://localhost:8000/transfer", {
                //   recipient,
                //   amount,
                //   token,
                // });
                botReply += "\nTransfer result: Success!";
              } catch (transferErr) {
                botReply += "\nTransfer failed!";
              }
            } else {
              botReply += "\nTransfer cancelled by user.";
            }
            break;
          case "get_balance":
            window.alert("balance is ...");
            break;
            case "swap_token":
              // swap_token(from_token: string, to_token: string, amount: integer)
            const { from_token, to_token, amount: swapAmount } = response?.data?.arguments;
            const swapConfirmMsg = `Do you want to swap ${swapAmount} ${from_token} to ${to_token}?`;
            if (window.confirm(swapConfirmMsg)) {
              // Call API to confirm swap (example endpoint)
              try {
                // const swapRes = await axios.post("http://localhost:8000/swap", {
                //   from_token,
                //   to_token,
                //   amount: swapAmount,
                // });
                botReply += `\nSwap result: Success! Swapped ${swapAmount} ${from_token} to ${to_token}.`;
              } catch (swapErr) {
                botReply += "\nSwap failed!";
              }
            }
        }
      } else if (response.data.raw) {
        botReply = response.data.raw;
      } else if (response.data) {
        botReply = response.data;
      } else {
        botReply = "Sorry, I could not understand.";
      }

      setMessages((prev) => [
        ...prev,
        new Message({ id: 1, message: botReply }),
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        new Message({ id: 1, message: "Server error!" }),
      ]);
    }
    setLoading(false);
  };


  return (
    <Card align='center' direction='column' w='100%' {...rest} height='600px'>
      <ChatFeed
        style={{ width: "100%", height: "800px", overflowY: "auto" }}
        messages={messages}
        isTyping={false}
        hasInputField={false}
        showSenderName
        bubblesCentered={false}
        bubbleStyles={{
          text: { fontSize: 16 },
          chatbubble: { borderRadius: 20, padding: 10 },
        }}
      />
      <div style={{ display: "flex", marginTop: 10 }}>
        <input
          style={{ flex: 1, padding: 8, fontSize: 16 }}
          value={currentInput}
          onChange={e => setCurrentInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Type your message..."
        />
        <button onClick={handleSend} style={{ marginLeft: 10, padding: "8px 16px" }} disabled={loading}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </Card>
  );
}
