'use client';

import { Box, Heading, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { supabase } from "@/supabase-client";

export interface Seat {
  id: number;
  seated_at: Date;
  status: number;
}

async function getSeats(): Promise<Seat[]> {
  const { data, error } = await supabase
    .from('seats')
    .select('*')
    .order('id', { ascending: true });
  if (error) {
    console.error('Error fetching seats:', error);
    return [];
  }
  return data || [];
}

// 席数の指定
const SEATS_NUM = 10;

// 数字と色の対応
const COLOR_STATUS = {
  0: 'white', // 空席
  1: 'green', // 10分経過
  2: 'blue', // 20分経過
  3: 'red', // 30分経過
}

export default function congestion() {
  const [SEATS, setSEATS] = useState<number[]>(Array.from({ length: SEATS_NUM }, () => 0));
  const SeatRegister = () => {
    const seatInput = document.querySelector('input[name="seat"]') as HTMLInputElement;
    const seat = parseInt(seatInput.value) - 1;
    if (seat >= 0 && seat < SEATS_NUM) {
      setSEATS(prev => {
        const newSeats = [...prev];
        newSeats[seat] = 1;
        return newSeats;
      });
    }
  }
  const SeatUnregister = () => {
    const seatInput = document.querySelector('input[name="seat"]') as HTMLInputElement;
    const seat = parseInt(seatInput.value) - 1;
    if (seat >= 0 && seat < SEATS_NUM) {
      setSEATS(prev => {
        const newSeats = [...prev];
        newSeats[seat] = 0;
        return newSeats;
      });
    }
  }
  useEffect(() => {
    const interval = setInterval(() => {
      setSEATS(currentValue => currentValue.map(value => {
        if (value >= 1){
          return value + 1;
        }
        return value;
        }));
      }, 600000);
    return () => clearInterval(interval);
  }, []);
  return (
    <Box>
      <Heading>混雑状況の確認</Heading>
      <Box marginTop={4} display="flex" gap={4}>
        <Text>席登録</Text>
        <input type="text" placeholder="席番号" name="seat" />
        <button onClick={SeatRegister}>決定</button>
      </Box>
      <Box marginTop={4} display="flex" gap={4}>
        <Text>席解除</Text>
        <input type="text" placeholder="席番号" name="seat" />
        <button onClick={SeatUnregister}>決定</button>
      </Box>
      <Box marginTop={4}>
        {SEATS.map((seat, index) => (
          <Box key={index} width="40px" height="40px" border="1px solid black" backgroundColor={COLOR_STATUS[seat as keyof typeof COLOR_STATUS]} margin="2px" />
        ))}
      </Box>
    </Box>
  );
}