'use client';

import { Box, Text, Button } from "@chakra-ui/react";
import { supabase } from "@/supabase-client";
import { useRouter } from "next/navigation";

export default function MealCompletionPage() {
    const router = useRouter();
    // 座席情報を削除
  async function deleteSeats(seatId: number) {
    await supabase.from('seats').delete().eq('id', seatId);
    router.push('/');
  }

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
          onClick={() => deleteSeats(1)}
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