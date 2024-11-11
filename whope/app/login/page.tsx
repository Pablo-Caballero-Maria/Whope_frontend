"use client";

import { Container, Box, Button, TextField, Typography } from '@mui/material';
import { useState, useEffect, SetStateAction, Dispatch } from 'react';
import { useRouter } from 'next/navigation';
import { deriveSymmetricKey, encryptWithSymmetricKey, importPublicKey, encryptWithPublicKey, decryptWithSymmetricKey } from '../utils/crypto_utils';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export default function Login() {
  const [username, setUsername]: [string, Dispatch<SetStateAction<string>>] = useState('');
  const [password, setPassword]: [string, Dispatch<SetStateAction<string>>] = useState('');
  const [webSocket, setWebsocket]: [WebSocket, Dispatch<SetStateAction<WebSocket>>] = useState(null);
  const [serverPublicKey, setServerPublicKey]: [CryptoKey, Dispatch<SetStateAction<CryptoKey>>] = useState(null);
  const [symmetricKey, setSymmetricKey]: [CryptoKey, Dispatch<SetStateAction<CryptoKey>>] = useState(null);
  const router: AppRouterInstance = useRouter();

  useEffect(() => {
    const webSocket: WebSocket = new WebSocket('ws://localhost:8000/ws/login/');
    webSocket.onopen = () => {
      setWebsocket(webSocket);
    };

    webSocket.onmessage = async (event: MessageEvent) => {
      const data: { public_key: string } = JSON.parse(event.data);
      const serverPublicKey: CryptoKey = await importPublicKey(data.public_key);
      setServerPublicKey(serverPublicKey);
    }

    return () => {
      webSocket.close();
    }
  }, []);

  const handleReceiveToken: (event: MessageEvent) => Promise<void> = async (event: MessageEvent) => {
    const data: { tokens: { refresh: string, access: string } } = JSON.parse(event.data);

    const encryptedToken: string = data.tokens.access;
    const token: string = await decryptWithSymmetricKey(symmetricKey, encryptedToken);
    localStorage.setItem('token', token);
    // store symmetric key in local localStorage
    const symmetricKeyValue: JsonWebKey = await window.crypto.subtle.exportKey('jwk', symmetricKey);
    const symmetricKeyValueString: string = JSON.stringify(symmetricKeyValue);
    localStorage.setItem('symmetricKey', symmetricKeyValueString);
    router.push('/loggedHome');
  };

  const handleLogin: () => Promise<void> = async () => {
    const symmetricKey: CryptoKey = await deriveSymmetricKey(password);
    setSymmetricKey(symmetricKey);

    const encryptedSymmetricKey: string = await encryptWithPublicKey(serverPublicKey, symmetricKey);
    const encryptedUsername: string = await encryptWithSymmetricKey(symmetricKey, username);
    const encryptedPassword: string = await encryptWithSymmetricKey(symmetricKey, password);

    webSocket.send(JSON.stringify({
      username: encryptedUsername,
      password: encryptedPassword,
      symmetric_key: encryptedSymmetricKey,
    }));

    // overwrite onmessage to handle the second message (the tokens)
    webSocket.onmessage = handleReceiveToken;
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

