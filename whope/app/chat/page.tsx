"use client";

import { Container, Box, Button, TextField, Typography } from '@mui/material';
import { useState, useEffect, SetStateAction, Dispatch, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { retrieveKey, deriveSymmetricKey, encryptWithSymmetricKey, importKey, encryptWithPublicKey, decryptWithSymmetricKey, storeKey } from '../utils/crypto_utils';

export default function Chat() {
  const [webSocket, setWebsocket]: [WebSocket, Dispatch<SetStateAction<WebSocket>>] = useState(null);
  const [currentMessage, setCurrentMessage]: [string, Dispatch<SetStateAction<string>>] = useState('');
  const [allMessages, setAllMessages]: [{ username: string, message: string }[], Dispatch<SetStateAction<{ username: string, message: string }[]>>] = useState([]);
  const [symmetricKey, setSymmetricKey]: [CryptoKey, Dispatch<SetStateAction<CryptoKey>>] = useState(null)
  const [newSymmetricKey, setNewSymmetricKey]: [CryptoKey, Dispatch<SetStateAction<CryptoKey>>] = useState(null);

  useEffect(() => {
    // cannot extract anything cuz "use client" pages doesnt support it
    const initialize = async () => {
      const symmetricKey: CryptoKey = await retrieveKey('symmetricKey', 'raw');
      const serverPublicKey: CryptoKey = await retrieveKey('serverPublicKey', 'spki');
      const encryptedSymmetricKey: string = await encryptWithPublicKey(serverPublicKey, symmetricKey);

      setSymmetricKey(symmetricKey);
      const encryptedToken: string = localStorage.getItem('encrypted_token');

      const webSocket: WebSocket = new WebSocket('ws://localhost:8000/ws/chat/');
      webSocket.onopen = () => {
        setWebsocket(webSocket);
        const message: string = JSON.stringify({ action: 'initialize_connection', encrypted_symmetric_key: encryptedSymmetricKey, encrypted_token: encryptedToken });
        webSocket.send(message);
      };

      webSocket.onmessage = async (event: MessageEvent) => {
        if (event.data.includes('message')) {
          const key: CryptoKey = newSymmetricKey !== null ? newSymmetricKey : symmetricKey;
          const data: { username: string, message: string } = JSON.parse(event.data);
          const username: string = await decryptWithSymmetricKey(key, data.username);
          const message: string = await decryptWithSymmetricKey(key, data.message);
          const messageObject: { username: string, message: string } = { username: username, message: message };
          setAllMessages((prevMessages) => [...prevMessages, messageObject]);

        } else if (event.data.includes('new_symmetric_key')) {
          const data: { new_symmetric_key: string } = JSON.parse(event.data);
          const decryptedNewSymmetricKey: string = await decryptWithSymmetricKey(symmetricKey, data.new_symmetric_key);
          const newSymmetricKey: CryptoKey = await importKey(decryptedNewSymmetricKey, 'raw');
          setNewSymmetricKey(newSymmetricKey);
        }
      };

      return () => {
        webSocket.close();
      };
    };

    initialize();
  }, []);

  const handleSendMessage: (e: React.KeyboardEvent) => void = async (e) => {
    if (e.key === 'Enter') {
      const encryptedUsername: string = localStorage.getItem('encrypted_username');
      const encryptedMessage: string = await encryptWithSymmetricKey(newSymmetricKey !== null ? newSymmetricKey : symmetricKey, currentMessage);
      const message: string = JSON.stringify({ action: 'send_message', username: encryptedUsername, message: encryptedMessage });
      webSocket.send(message);
      setCurrentMessage('');
    }
  }

  const renderMessage: (message: { username: string, message: string }, index: number) => JSX.Element = (message, index) => {
    return (
      <Typography key={index}>
        {message.username}: {message.message}
      </Typography>
    );
  }

  const messageList: () => JSX.Element = () => {
    return (
      <Box>
        {allMessages.map((message, index) => renderMessage(message, index))}
      </Box>
    );
  }

  const inputBox: () => JSX.Element = () => {
    return (
      <Box>
        <TextField
          id="outlined-basic"
          label="Message"
          variant="outlined"
          value={currentMessage}
          onChange={(e => setCurrentMessage(e.target.value))}
          onKeyDown={(e) => { handleSendMessage(e) }}
        />
      </Box>
    );
  }

  const container: () => JSX.Element = () => {
    return (
      <Container>
        {messageList()}
        {inputBox()}
      </Container>
    );
  }

  return container();

}
