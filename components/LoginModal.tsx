'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  VStack,
  Text,
  HStack,
  useToast,
} from '@chakra-ui/react'

// Modalの開閉状態を親(Header)から受け取るためのProps
interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage('エラー: ' + error.message)
    } else {
      // ログイン成功
      toast({
        title: 'ログインしました。',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onClose() // モーダルを閉じる
      router.refresh() // ヘッダーの状態を更新
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setMessage('エラー: ' + authError.message)
      return
    }
    if (!authData.user) {
      setMessage('エラー: ユーザーが作成されませんでした。')
      return
    }

    // profilesテーブルにも挿入
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ 
        id: authData.user.id,
        email: authData.user.email,
        role: 'user', // デフォルトロール
        point: 1000   // デフォルトポイント
      })

    if (profileError) {
       setMessage('エラー (Profile): ' + profileError.message)
    } else {
      setMessage('確認メールを送信しました。メール内のリンクをクリックしてください。')
    }
  }

  // モーダルが閉じられたときにフォームをリセット
  const handleClose = () => {
    setEmail('')
    setPassword('')
    setMessage('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>ログイン / 新規登録</ModalHeader>
        <ModalCloseButton />
        
        <form>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel htmlFor="email">メールアドレス</FormLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel htmlFor="password">パスワード</FormLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <VStack w="100%">
              <HStack w="100%" justify="center">
                <Button colorScheme="blue" onClick={handleLogin}>
                  ログイン
                </Button>
                <Button colorScheme="green" onClick={handleSignUp}>
                  新規登録
                </Button>
              </HStack>
              {message && (
                <Text color={message.startsWith('エラー') ? 'red.500' : 'green.500'} fontSize="sm" mt={3}>
                  {message}
                </Text>
              )}
            </VStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}