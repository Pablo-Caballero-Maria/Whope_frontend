"use client";

import { Container, Box, TextField, Typography, IconButton, InputAdornment } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useState, useEffect, SetStateAction, Dispatch } from 'react';
import { retrieveKey, encryptWithSymmetricKey, encryptWithPublicKey, decryptWithSymmetricKey } from '../utils/crypto_utils';

export default function Chat() {

  type Generic<T> = Dispatch<SetStateAction<T>>;
  const [webSocket, setWebsocket]: [WebSocket, Generic<WebSocket>] = useState(null);
  const [currentMessage, setCurrentMessage]: [string, Generic<string>] = useState('');
  interface Message { username: string, message: string };

  const [allMessages, setAllMessages] = useState([]);

  const [symmetricKey, setSymmetricKey]: [CryptoKey, Generic<CryptoKey>] = useState(null)

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
          const data: Message = JSON.parse(event.data);
          const username: string = await decryptWithSymmetricKey(symmetricKey, data.username);
          const message: string = await decryptWithSymmetricKey(symmetricKey, data.message);
          const messageObject: { username: string, message: string } = { username: username, message: message };
          setAllMessages((prevMessages) => [...prevMessages, messageObject]);
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
      const encryptedMessage: string = await encryptWithSymmetricKey(symmetricKey, currentMessage);
      const message: string = JSON.stringify({ action: 'send_message', username: encryptedUsername, message: encryptedMessage });
      webSocket.send(message);
      setCurrentMessage('');
    }
  }

  const renderMessage: (message: Message, index: number) => JSX.Element = (message: Message, index: number) => {
    return (
      <Typography key={index} sx={{ marginBottom: 2 }}>
        <span style={{ color: message.username === "bot" ? "blue" : "inherit" }}>
          {message.username}
        </span>
        : {message.message}
      </Typography>
    );
  }

  const messageList: () => JSX.Element = () => {
    return (
      <Box>
        {allMessages.map((message: Message, index: number) => renderMessage(message, index))}
      </Box>
    );
  }

  const inputBox: () => JSX.Element = () => {
    return (
      <Box sx={{ width: '50%' }}>
        <TextField
          fullWidth
          id="outlined-basic"
          label="Message"
          placeholder="Type your message here..."
          variant="outlined"
          value={currentMessage}
          onChange={(e => setCurrentMessage(e.target.value))}
          onKeyDown={(e) => { handleSendMessage(e) }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => handleSendMessage()}>
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    );
  }

  const mainBox: () => JSX.Element = () => {
    return (
      <>
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            overflowY: "auto"
          }}
        >
          {messageList()}
        </Box>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          {inputBox()}
        </Box>
      </>
    );
  };

  const container: () => JSX.Element = () => {
    return (
      <Container>
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {mainBox()}
        </Box>
      </Container>
    );
  }

  return container();
}
