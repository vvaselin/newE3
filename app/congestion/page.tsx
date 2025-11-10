'use client';

import { Box, Heading, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

// 席数の指定
const SEATS_NUM = 24;

// 数字と色の対応
const COLOR_STATUS = {
  0: 'white', // 空席
  1: 'green', // 10分経過
  2: 'blue', // 20分経過
  3: 'red', // 30分経過
}

export interface Seat {
  id: number;
  seated_at: Date;
  status: number;
  user_id: string;
}

export default function congestion() {
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
  // 座席情報を管理
  const [seats, setSeats] = useState<Seat[]>([]);
  // 座席情報を取得
  async function getSeats(): Promise<Seat[]> {
    const { data: seats, error } = await supabase
      .from('seats')
      .select('*')
      .order('id', { ascending: true });
    if (error) {
      return [];
    }
    return seats || [];
  }

  // 座席情報を追加
  async function addSeats(seatId: number) {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('seats').insert([{
      id: seatId,
      seated_at: new Date(new Date().toISOString()),
      status: 1,
      user_id: userId
    }])
  }

  // 座席情報を削除
  async function deleteSeats(seatId: number) {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('seats').delete().eq('id', seatId).eq('user_id', userId);
  }

  // 座席登録
  const SeatRegister = async (seatId: number) => {
    if (seatId >= 1 && seatId <= SEATS_NUM) {
      await addSeats(seatId);
      const updatedSeats = await getSeats();
      setSeats(updatedSeats);
    }
  }

  // 座席解除
  const SeatUnregister = async (seatId: number) => { 
    if (seatId >= 1 && seatId <= SEATS_NUM) {
      await deleteSeats(seatId);
      const updatedSeats = await getSeats();
      setSeats(updatedSeats);
    }
  }

  // statusを更新する関数
  const updateSeatStatus = async (seatId: number) => {
    const { data: seat, error } = await supabase
      .from('seats')
      .select('*')
      .eq('id', seatId)
      .single();
    
    if (error || !seat) return;
    
    const now = new Date();
    const seatedAt = new Date(seat.seated_at);
    const diffMinutes = Math.floor((now.getTime() - seatedAt.getTime()) / (1000 * 60));
    
    // 1分ごとにstatusを更新（最大4まで）
    const newStatus = Math.min(Math.floor(diffMinutes / 1) + 1, 4);
    
    if (newStatus !== seat.status) {
      if (newStatus === 4) {
        deleteSeats(seatId);
        const updatedSeats = await getSeats();
        setSeats(updatedSeats);
      } else {
        await supabase
          .from('seats')
          .update({ status: newStatus })
          .eq('id', seatId);
        const updatedSeats = await getSeats();
        setSeats(updatedSeats);
      }
    }
  };

  // 全ての座席のstatusを更新
  const updateAllSeatStatuses = async () => {
    const currentSeats = await getSeats();
    for (const seat of currentSeats) {
      await updateSeatStatus(seat.id);
    }
    // 更新後に座席情報を再取得
    const updatedSeats = await getSeats();
    setSeats(updatedSeats);
  };

  // 起動時に座席情報を取得
  useEffect(() => {
    const loadSeats = async () => {
      const initialSeats = await getSeats();
      setSeats(initialSeats);
    };
    loadSeats();
  }, []);

  // 1分おきにstatusを更新するタイマー
  useEffect(() => {
    const interval = setInterval(() => {
      updateAllSeatStatuses();
    }, 1 * 1000); // 30秒 = 30 * 1000ミリ秒

    return () => clearInterval(interval);
  }, []);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="flex-start" minHeight="100vh" paddingTop={8} position="relative">
      <Heading>混雑状況の確認</Heading>
      {/*}
      <Box marginTop={4} display="flex" gap={4}>
        <Text>席登録</Text>
        <input type="number" placeholder="席番号" name="registerSeat" />
        <button onClick={() => {
          const seatInput = document.querySelector('input[name="registerSeat"]') as HTMLInputElement;
          const seatId = parseInt(seatInput.value);
          if (!isNaN(seatId)) {
            SeatRegister(seatId);
          } else {
            alert('有効な席番号を入力してください');
          }
        }}>決定</button>
      </Box>
      <Box marginTop={4} display="flex" gap={4}>
        <Text>席解除</Text>
        <input type="number" placeholder="席番号" name="unregisterSeat" />
        <button onClick={() => {
          const seatInput = document.querySelector('input[name="unregisterSeat"]') as HTMLInputElement;
          const seatId = parseInt(seatInput.value);
          if (!isNaN(seatId)) {
            SeatUnregister(seatId);
          } else {
            alert('有効な席番号を入力してください');
          }
        }}>決定</button>
      </Box>
      */}
      <Box 
        marginTop={4} 
        display="grid" 
        gridTemplateColumns="repeat(4, 1fr)" 
        gridTemplateRows="repeat(6, 1fr)"
        gap={16}
        maxWidth="fit-content"
      >
        {Array.from({ length: SEATS_NUM }).map((_, index) => {
          const seat = seats.find(s => s.id === index + 1);
          let backgroundColor;
          
          if (!seat) {
            backgroundColor = COLOR_STATUS[0];
          } else {
            switch (seat.status) {
              case 1:
                backgroundColor = COLOR_STATUS[1];
                break;
              case 2:
                backgroundColor = COLOR_STATUS[2];
                break;
              case 3:
                backgroundColor = COLOR_STATUS[3];
                break;
              default:
                backgroundColor = COLOR_STATUS[0];
            }
          }

          return (
            <Box 
              key={index}
              width="40px"
              height="40px"
              border="1px solid black"
              backgroundColor={backgroundColor}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {index + 1}
            </Box>
          );
        })}
      </Box>
      
      {/* 色ごとの時間経過の凡例 */}
      <Box
        position="fixed"
        bottom={4}
        right={4}
        backgroundColor="white"
        padding={4}
        border="1px solid gray"
        borderRadius="md"
        boxShadow="md"
        display="flex"
        flexDirection="column"
        gap={2}
        minWidth="200px"
      >
        <Text fontWeight="bold" marginBottom={2}>時間経過</Text>
        <Box display="flex" alignItems="center" gap={2}>
          <Box width="20px" height="20px" backgroundColor="white" border="1px solid black" />
          <Text>空席</Text>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Box width="20px" height="20px" backgroundColor="green" border="1px solid black" />
          <Text>1分経過</Text>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Box width="20px" height="20px" backgroundColor="blue" border="1px solid black" />
          <Text>2分経過</Text>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Box width="20px" height="20px" backgroundColor="red" border="1px solid black" />
          <Text>3分経過</Text>
        </Box>
      </Box>
    </Box>
  );
}