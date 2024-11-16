"use client";

import { Container, Box, Button, TextField, Typography } from '@mui/material';
import { useState, useEffect, SetStateAction, Dispatch } from 'react';
import { useRouter } from 'next/navigation';
import { deriveSymmetricKey, encryptWithSymmetricKey, importKey, encryptWithPublicKey, decryptWithSymmetricKey, storeKey } from '../utils/crypto_utils';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export default function Login() {
  const [username, setUsername]: [string, Dispatch<SetStateAction<string>>] = useState('');
  const [password, setPassword]: [string, Dispatch<SetStateAction<string>>] = useState('');
  const [webSocket, setWebsocket]: [WebSocket, Dispatch<SetStateAction<WebSocket>>] = useState(null);
  const [serverPublicKey, setServerPublicKey]: [CryptoKey, Dispatch<SetStateAction<CryptoKey>>] = useState(null);
  const router: AppRouterInstance = useRouter();

  useEffect(() => {
    const webSocket: WebSocket = new WebSocket('ws://localhost:8000/ws/login/');
    webSocket.onopen = () => {
      setWebsocket(webSocket);
    };

    webSocket.onmessage = async (event: MessageEvent) => {
      const data: { public_key: string } = JSON.parse(event.data);
      const serverPublicKey: CryptoKey = await importKey(data.public_key, "spki");
      // no need to encrypt the server public key because its public
      setServerPublicKey(serverPublicKey);
      await storeKey(serverPublicKey, 'serverPublicKey', 'spki');
    }

    return () => {
      webSocket.close();
    }
  }, []);

  const handleReceiveToken: (event: MessageEvent) => Promise<void> = async (event: MessageEvent) => {
    const data: { tokens: { refresh: string, access: string } } = JSON.parse(event.data);

    const encryptedToken: string = data.tokens.access;
    localStorage.setItem('encrypted_token', encryptedToken);
    router.push('/loggedHome');
  };

  const handleLogin: () => Promise<void> = async () => {

    const symmetricKey: CryptoKey = await deriveSymmetricKey(password);
    // no need to store the symmetric key encripted with itself
    await storeKey(symmetricKey, 'symmetricKey', 'raw');

    const encryptedSymmetricKey: string = await encryptWithPublicKey(serverPublicKey, symmetricKey);
    const encryptedUsername: string = await encryptWithSymmetricKey(symmetricKey, username);
    const encryptedPassword: string = await encryptWithSymmetricKey(symmetricKey, password);

    // to send it along his messages without having to re-encrypt it every time he sends a message
    localStorage.setItem('encrypted_username', encryptedUsername);

    webSocket.send(JSON.stringify({
      encrypted_username: encryptedUsername,
      encrypted_password: encryptedPassword,
      encrypted_symmetric_key: encryptedSymmetricKey,
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

