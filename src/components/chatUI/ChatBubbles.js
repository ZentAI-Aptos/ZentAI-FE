import React from "react";
import { Box, Text, Flex, useColorModeValue } from "@chakra-ui/react";

export default function ChatBubbles({ messages, isLoading }) {
  const userBg = useColorModeValue("blue.500", "blue.400");
  const botBg = useColorModeValue("gray.200", "gray.700");
  const userColor = "white";
  const botColor = useColorModeValue("gray.800", "white");

  return (
    <Flex direction="column" gap={3} py={3}>
      {messages.map((msg, idx) => (
        <Flex
          key={idx}
          justify={msg.id === 0 ? "flex-end" : "flex-start"}
          align="flex-end"
        >
          <Box
            px={4}
            py={2}
            bg={msg.id === 0 ? userBg : botBg}
            color={msg.id === 0 ? userColor : botColor}
            borderRadius="100px"
            maxW="75%"
            fontSize="md"
            // boxShadow="md"
            wordBreak="break-word"
          >
            <Text whiteSpace="pre-line">{msg.message}</Text>
          </Box>
        </Flex>
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
