"use client"

import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export default function Home() {

  const router: AppRouterInstance = useRouter();

  const handleChat: () => void = () => {
    router.push('/chat');
  }

  const chatButton: () => JSX.Element = () => {
    return (
      <Button sx={{ width: '50%' }} variant="contained" color="primary" onClick={handleChat}>
        Chat
      </Button>
    );
  }

  return chatButton()
}
