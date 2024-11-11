"use client";

import { Container, Box, Button, TextField, Typography, FormControlLabel, Switch } from '@mui/material';
import { useState, useEffect, SetStateAction, Dispatch } from 'react';
import { useRouter } from 'next/navigation';
import { deriveSymmetricKey, encryptWithSymmetricKey } from '../utils/crypto_utils';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export default function Register() {
  const [username, setUsername]: [string, Dispatch<SetStateAction<string>>] = useState('');
  const [password, setPassword]: [string, Dispatch<SetStateAction<string>>] = useState('');
  const [isWorker, setIsWorker]: [string, Dispatch<SetStateAction<string>>] = useState('false');
  const [websocket, setWebsocket]: [WebSocket, Dispatch<SetStateAction<WebSocket>>] = useState(null);
  const router: AppRouterInstance = useRouter();

  useEffect(() => {
    const ws: WebSocket = new WebSocket('ws://localhost:8000/ws/register/');
    ws.onopen = () => {
      setWebsocket(ws);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleRegister: () => Promise<void> = async () => {
    const symmetricKey: CryptoKey = await deriveSymmetricKey(password);
    const encrypted_username: string = await encryptWithSymmetricKey(symmetricKey, username);
    const encrypted_password: string = await encryptWithSymmetricKey(symmetricKey, password);
    const isWorkerCap: string = isWorker.charAt(0).toUpperCase() + isWorker.slice(1);
    websocket.send(JSON.stringify({ username: encrypted_username, password: encrypted_password, is_worker: isWorkerCap }));
    router.push('/');
  };

  const switchComponent: () => JSX.Element = () => {
    return (
      <FormControlLabel
        sx={{ width: '50%', justifyContent: 'center' }}
        control={
          <Switch
            onChange={(e) => setIsWorker(e.target.checked.toString())}
            name="isWorker"
            color="primary"
          />
        }
        label="Are you a worker?"
      />
    );
  };

  const submitButton: () => JSX.Element = () => {
    return (
      <Button sx={{ width: '50%' }} variant="contained" color="primary" onClick={handleRegister}>
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

  const registerTitle: () => JSX.Element = () => {
    return (
      <Typography variant="h4" component="h1" gutterBottom>
        Register
      </Typography>
    );
  };

  const registerBox: () => JSX.Element = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        {registerTitle()}
        {usernameField()}
        {passwordField()}
        {switchComponent()}
        {submitButton()}
      </Box>
    );
  };

  const registerContainer: () => JSX.Element = () => {
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
        {registerBox()}
      </Container>
    );
  };

  return registerContainer();
}

