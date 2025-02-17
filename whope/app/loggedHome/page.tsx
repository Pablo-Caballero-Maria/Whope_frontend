"use client"

import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export default function Home() {

  const router: AppRouterInstance = useRouter();

  const handleChat: () => void = () => {
    router.push('/chat');
  }

  const chatButton: () => JSX.Element = () => {
    return (
      <Button sx={{ width: '300px' }} variant="contained" color="primary" onClick={handleChat}>
        Chat
      </Button>
    );
  }

  const chatBox: () => JSX.Element = () => {
    return (
      <Box
          sx={{
            position: 'absolute',
            top: '90%',
          }}
        >
          {chatButton()}
        </Box>
    )
  }

  const title: () => JSX.Element = () => {
    return (
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 10 }}>
        Welcome to Whope
      </Typography>
    );
  }

  const mainBox: () => JSX.Element = () => {
    return (
      <Box sx={{ position: 'relative', minHeight: '100vh',  display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {title()}
        {chatBox()}
      </Box>
    )
  }

  return mainBox()
}
