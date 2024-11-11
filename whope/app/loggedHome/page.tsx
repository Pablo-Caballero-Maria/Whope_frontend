"use client"

import { Container, Box, Button, TextField, Typography } from '@mui/material';
import { useState, useRef, RefObject, SetStateAction, Dispatch } from 'react';
import { useRouter } from 'next/navigation';
import { deriveSymmetricKey, encryptWithSymmetricKey, importPublicKey, encryptWithPublicKey, decryptWithSymmetricKey } from '../utils/crypto_utils';
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

  return chatButton
}
