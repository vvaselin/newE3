'use client';

import { Box, Text, Button } from "@chakra-ui/react";
import { createClient } from '@/utils/supabase/client';
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MealCompletionPage() {
  const router = useRouter();
  const supabase = createClient();

  // ユーザーIDを取得
  async function getUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('ログインが必要です');
      return null;
    }
    return user.id;
  }
  // 食事完了ボタン
  async function mealCompletionButton() {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('seats').delete().eq('user_id', userId);
    router.push('/');
  }

  useEffect(() => {
    const interval = setInterval(() => {
      alert('食事がお済みになりましたら、食事完了ボタンを押してください');
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box 
      height="100vh" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
    >
      <Box display="flex" flexDirection="column" alignItems="center">
        <Text fontSize="2xl" textAlign="center">
          ご利用ありがとうございます。
          <br />
          お食事が済みましたら、
          <br />
          食事完了を押されるように
          <br />
          ご協力お願いします。
        </Text>
        <Button 
          onClick={() => mealCompletionButton()}
          marginTop={4}
          marginBottom={4}
          display="block"
        >
          食事完了
        </Button>
      </Box>
    </Box>
  )
}