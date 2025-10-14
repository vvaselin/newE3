import type { Metadata } from "next";
import { Box, Heading, Text } from "@chakra-ui/react";

// 席数の指定
const ROWS = 20;
const COLS = 10;

// 数字と色の対応
const COLOR_STATUS = {
  0: 'white', // 空席
  1: 'green', // 10分経過
  2: 'blue', // 20分経過
  3: 'red', // 30分経過
}

export const metadata: Metadata = {
  title: "混雑状況の確認",
  description: "混雑状況の確認",
};

export default function congestion() {
  return (
    <Box>
      <Heading>混雑状況の確認</Heading>
      <Box marginTop={4}>
        <Text display="inline">列</Text>
        <select>
          {Array.from({ length: COLS }, (_, i) => {
            const letter = String.fromCharCode(65 + i);
            return (
              <option key={letter} value={letter}>
                {letter}
              </option>
            );
          })}
        </select>
        <Text display="inline">行</Text>
        <select style={{marginLeft: "8px"}}>
          {Array.from({ length: ROWS }, (_, i) => {
            const number = i + 1;
            return (
              <option key={number} value={number}>
                {number}
              </option>
            );
          })}
        </select>
        <Text display="inline">色</Text>
        <select style={{marginLeft: "8px"}}>
          {Array.from({ length: 4 }, (_, i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </Box>
    </Box>
  );
}