"use client";

import { Container, Box, Button, TextField, Typography } from '@mui/material';
import { useState, useRef, RefObject, SetStateAction, Dispatch } from 'react';
import { useRouter } from 'next/navigation';
import { deriveSymmetricKey, encryptWithSymmetricKey, importPublicKey, encryptWithPublicKey, decryptWithSymmetricKey } from '../utils/crypto_utils';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export default function Register() {
  const [username, setUsername]: [string, Dispatch<SetStateAction<string>>] = useState('');
  const [password, setPassword]: [string, Dispatch<SetStateAction<string>>] = useState('');
  const symmetricKeyRef: RefObject<CryptoKey> = useRef<CryptoKey>(null)
  const webSocketRef: RefObject<WebSocket> = useRef<WebSocket>(null);

  const router: AppRouterInstance = useRouter();

  const handleWebSocketMessage: (event: MessageEvent) => Promise<void> = async (event: MessageEvent) => {
    const data: { public_key: string } | { tokens: { refresh: string, access: string } } = JSON.parse(event.data);

    if (data.public_key) {
      const serverPublicKey: CryptoKey = await importPublicKey(data.public_key);
      const encryptedSymmetricKey: string = await encryptWithPublicKey(serverPublicKey, symmetricKeyRef.current);
      const encryptedUsername: string = await encryptWithSymmetricKey(symmetricKeyRef.current, username);
      const encryptedPassword: string = await encryptWithSymmetricKey(symmetricKeyRef.current, password);

      webSocketRef.current?.send(JSON.stringify({
        username: encryptedUsername,
        password: encryptedPassword,
        symmetric_key: encryptedSymmetricKey,
      }));
    }

    if (data.tokens) {
      const encryptedToken: string = data.tokens.access;
      const token: string = await decryptWithSymmetricKey(symmetricKeyRef.current, encryptedToken);
      console.log(token);
      webSocketRef.current?.close();
      // router.push('/');
    }
  };

  const handleLogin: () => Promise<void> = async () => {
    // Create new WebSocket connection
    const webSocket: WebSocket = new WebSocket('ws://localhost:8000/ws/login/');
    // Store in ref immediately
    webSocketRef.current = webSocket;
    webSocket.onmessage = handleWebSocketMessage;
    // Create and store symmetric key
    const symmetricKey: CryptoKey = await deriveSymmetricKey(password);
    symmetricKeyRef.current = symmetricKey;
    // Wait for WebSocket to open
    await new Promise<void>((resolve, reject) => {
      webSocket.onopen = () => {
        resolve();
      };
    });
  };

  const submitButton: () => JSX.Element = () => {
    return (
      <Button sx={{ width: '50%' }} variant="contained" color="primary" onClick={handleLogin}>
        Submit
      </Button>
    );
  };

  const usernameField: () => JSX.Element = () => {
    return (
      <TextField
        sx={{
          input: { color: 'lightblue' },
          width: '50%',
        }}
        label="Username"
        variant="outlined"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
    );
  };

  const passwordField: () => JSX.Element = () => {
    return (
      <TextField
        sx={{
          input: { color: 'lightblue' },
          width: '50%',
        }}
        label="Password"
        type="password"
        variant="outlined"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    );
  };

  const loginTitle: () => JSX.Element = () => {
    return (
      <Typography variant="h4" component="h1" gutterBottom>
        Login
      </Typography>
    );
  };

  const loginBox: () => JSX.Element = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        {loginTitle()}
        {usernameField()}
        {passwordField()}
        {submitButton()}
      </Box>
    );
  };

  const loginContainer: () => JSX.Element = () => {
    return (
      <Container
        sx={{
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          height: '100vh',
          textAlign: 'center',
        }}
      >
        {loginBox()}
      </Container>
    );
  };

  return loginContainer();
}

