import type { Metadata } from "next";
import { Box, Heading } from "@chakra-ui/react";

// 席数の指定
const ROWS = 20;
const COLS = 10;
const COL_LABELS = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i));

// 数字と色の対応
const COLOR_MAP = {
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
      
    </Box>
  );
}