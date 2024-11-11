"use client";

import { Button, Box, Container, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export default function Home() {
  const router: AppRouterInstance = useRouter();

  const handleRegister: () => void = () => {
    router.push('/register');
  };

  const handleLogin: () => void = () => {
    router.push('/login');
  }

  const registerButton: () => JSX.Element = () => {
    return (
      <Button sx={{ width: '40%' }} variant="contained" color="primary" onClick={handleRegister}>
        Register
      </Button>
    );
  };

  const loginButton: () => JSX.Element = () => {
    return (
      <Button sx={{ width: '40%' }} variant="outlined" color="primary" onClick={handleLogin}>
        Login
      </Button>
    );
  };

  const buttonBox: () => JSX.Element = () => {
    return (
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'center', gap: 2 }}>
        {registerButton()}
        {loginButton()}
      </Box>
    );
  };

  const homeTitle: () => JSX.Element = () => {
    return (
      <Typography variant="h4" component="h1" gutterBottom>
        Home
      </Typography>
    );
  };

  const logo: () => JSX.Element = () => {
    return (
      <Box
        component="img"
        src="/next.svg"
        alt="Logo"
        sx={{
          width: '100%',
          height: '30%',
        }}
      />
    );
  };

  const homeContainer: () => JSX.Element = () => {
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
        {homeTitle()}
        {logo()}
        {buttonBox()}
      </Container>
    );
  };

  return homeContainer();
}

