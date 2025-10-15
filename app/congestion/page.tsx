'use client';

import { Box, Heading, Text } from "@chakra-ui/react";
import { useState } from "react";

// 席数の指定
const SEATS_NUM = 20;

// 数字と色の対応
const COLOR_STATUS = {
  0: 'white', // 空席
  1: 'green', // 10分経過
  2: 'blue', // 20分経過
  3: 'red', // 30分経過
}

export default function congestion() {
  const [SEATS, setSEATS] = useState<number[]>(Array.from({ length: SEATS_NUM }, () => 0));
  const handleSubmit = () => {
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
  return (
    <Box>
      <Heading>混雑状況の確認</Heading>
      <Box marginTop={4} display="flex" gap={4}>
        <input type="text" placeholder="席番号" name="seat" />
        <button onClick={handleSubmit}>決定</button>
      </Box>
      <Box marginTop={4}>
        {SEATS.map((seat, index) => (
          <Box key={index} width="40px" height="40px" border="1px solid black" backgroundColor={seat === 1 ? 'red' : COLOR_STATUS[seat as keyof typeof COLOR_STATUS]} margin="2px" />
        ))}
      </Box>
    </Box>
  );
}