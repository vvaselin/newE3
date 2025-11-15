// app/orderState/OrderState.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Divider,
  useToast,
  SimpleGrid,
} from "@chakra-ui/react";
import { supabase } from "@/supabase-client";
import { useRouter } from "next/navigation";

/**
 * OrderState
 * - 表示ルール:
 *   - 調理中: 支払いから COOK_MIN 分以内
 *   - 調理済み: COOK_MIN 〜 (COOK_MIN+DONE_MIN) の範囲
 *   - 合計で REMOVE_MIN 分経過したら削除対象
 * - ローカル楽観更新 + サーバー同期（最新の paid_at を優先してマージ）
 * - localStorage にキャッシュを保存してページ遷移後も即時表示
 */

// ----- 設定 -----
// paid_at からの許容時間（分）。この時間以内の注文のみ表示対象とする
const DISPLAY_WITHIN_MIN = 60; // 分
const POLL_INTERVAL_MS = 5 * 1000; // 5秒ポーリング
const TICK_MS = 1000; // 秒ごとにUI更新
const ORDERS_CACHE_KEY = "orders_cache_v1";

type OrderRow = {
  seat_number: number | string;
  paid_at: string; // ISO
  cooking?: boolean;
  id?: string;
};

// NOTE: per-seat receive buttons removed. A single "自分の注文商品を受け取る" button
/**
 * 固定表示の「自分の注文商品を受け取る」ボタン
 * 画面を上下左右で4分割したときの右下に表示されるように固定する
 */
function MyReceiveButton() {
  const router = useRouter();
  return (
    <Button colorScheme="blue" onClick={() => router.push('/receive')} size="md">
      自分の注文商品を受け取る
    </Button>
  );
}

export default function OrderState() {
  const toast = useToast();
  const router = useRouter();

  // --- state ---
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [, setTick] = useState<number>(Date.now()); // 秒更新トリガ

  // ----- ユーティリティ -----
  const parsePaidAtMs = (iso: string): number => {
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t : 0;
  };

  const elapsedMs = (iso: string): number => Date.now() - parsePaidAtMs(iso);

  const formatElapsed = (iso: string) => {
    const ms = elapsedMs(iso);
    if (!Number.isFinite(ms) || ms < 0) return "0秒";
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return min > 0 ? `${min}分 ${sec}秒` : `${sec}秒`;
  };

  // ----- DB 操作 -----
  const fetchOrders = useCallback(async (): Promise<OrderRow[]> => {
    try {
      const { data, error } = await supabase.from("orders").select("*").order("seat_number", { ascending: true });
      if (error) {
        console.error("fetchOrders error:", error);
        return [];
      }
      return (data as OrderRow[]) ?? [];
    } catch (err) {
      console.error("fetchOrders unexpected:", err);
      return [];
    }
  }, []);

  // ----- 表示分類: paid_at が DISPLAY_WITHIN_MIN 分以内のものを表示対象とする -----
  const categorizeOrders = useCallback((rows: OrderRow[]) => {
    const cooking: OrderRow[] = [];
    const done: OrderRow[] = [];
    const windowMs = DISPLAY_WITHIN_MIN * 60 * 1000;
    for (const r of rows) {
      if (!r || !r.paid_at) continue;
      const ms = elapsedMs(r.paid_at);
      if (ms <= 0 || ms > windowMs) continue; // 過去すぎる・未来のタイムスタンプは除外
      if (r.cooking === true) cooking.push(r);
      else done.push(r);
    }
    cooking.sort((a, b) => Number(a.seat_number) - Number(b.seat_number));
    done.sort((a, b) => Number(a.seat_number) - Number(b.seat_number));
    return { cooking, done };
  }, []);

  // ----- 同期とマージ（サーバー優先） -----
  const mergeLatestAndPrev = (latest: OrderRow[], prev: OrderRow[]) => {
    const map = new Map<number, OrderRow>();
    const pushIfNewer = (r: OrderRow) => {
      const n = Number(r.seat_number);
      if (Number.isNaN(n)) return;
      const existing = map.get(n);
      if (!existing) {
        map.set(n, r);
        return;
      }
      const tExisting = parsePaidAtMs(existing.paid_at);
      const tNew = parsePaidAtMs(r.paid_at);
      if (tNew > tExisting) map.set(n, r);
    };

    for (const r of latest) pushIfNewer(r);
    for (const r of prev) pushIfNewer(r);

    return Array.from(map.values()).sort((a, b) => Number(a.seat_number) - Number(b.seat_number));
  };

  const refreshAndSync = useCallback(async () => {
    try {
      // サーバーから最新を取得して、ローカル state とマージする
      const latest = await fetchOrders();
      setOrders((prev) => {
        const merged = mergeLatestAndPrev(latest, prev);
        try { localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(merged)); } catch {}
        return merged;
      });
    } catch (err) {
      console.error("refreshAndSync error:", err);
    }
  }, [fetchOrders]);

  // registerPayment removed: payment registration is handled via checkout APIs

  // ----- 初回読み込み: localCache -> サーバーマージ -----
  useEffect(() => {
    let mounted = true;

    try {
      const raw = localStorage.getItem(ORDERS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as OrderRow[];
        if (Array.isArray(parsed) && parsed.length > 0) setOrders(parsed);
      }
    } catch (e) {
      console.debug("no orders cache or parse failed", e);
    }

    (async () => {
      const latest = await fetchOrders();
      if (!mounted) return;
      setOrders((prev) => {
        const merged = mergeLatestAndPrev(latest, prev);
        try { localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(merged)); } catch {}
        return merged;
      });
    })();

    return () => { mounted = false; };
  }, [fetchOrders]);

  // ----- ポーリングとイベント -----
  useEffect(() => {
    refreshAndSync();
    const id = setInterval(refreshAndSync, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refreshAndSync]);

  useEffect(() => {
    const onFocus = () => refreshAndSync();
    const onVisibility = () => { if (document.visibilityState === "visible") refreshAndSync(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshAndSync]);

  // 秒ごとに再レンダリング（経過時間用）
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  // 表示データ (orders を分類して表示)
  const { cooking: cookingOrders, done: doneOrders } = categorizeOrders(orders);

  // admin registration handlers removed

  return (
    <Box p={6}>
      {/* 管理者操作は `app/admin` 以下で行います。OrderState は表示専用です。 */}

      {/* 利用者向け: 受け取りボタンは画面右下に固定表示する（MyReceiveButton） */}

      {/* 表示領域：orders テーブルの内容に従って調理中 / 調理済みに振り分けて表示 */}
      <Box border="2px solid" borderColor="gray.300" borderRadius="md" p={6} bg="white" boxShadow="sm">
        <SimpleGrid columns={2} spacing={6} alignItems="start">
          {/* 調理中 */}
          <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3} bg="yellow.50">
            <VStack align="stretch">
              <Heading size="md" width="100%" textAlign="center">調理中 ({cookingOrders.length}件)</Heading>
              <Divider />
              {cookingOrders.length === 0 ? (
                <Text color="gray.500">現在、調理中の商品はありません。</Text>
              ) : (
                <HStack wrap="wrap" spacing={2} mt={2}>
                  {cookingOrders.map((order) => {
                    const seat = Number(order.seat_number);
                    return (
                      <Box key={order.id ?? seat} px={3} py={2} borderRadius="md" border="1px solid" borderColor="gray.300" backgroundColor="yellow.100">
                        <Text fontWeight="bold">席 {seat}</Text>
                      </Box>
                    );
                  })}
                </HStack>
              )}
            </VStack>
          </Box>

          {/* 調理済み */}
          <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3} bg="green.50" position="relative">
            {/* 左側の区切り線 */}
            <Box position="absolute" left={0} top={0} bottom={0} width="2px" bg="gray.300" />
            <VStack align="stretch">
              <Heading size="md" width="100%" textAlign="center">調理済み ({doneOrders.length}件)</Heading>
              <Divider />
              {doneOrders.length === 0 ? (
                <Text color="gray.500">現在、調理済みの商品はありません。</Text>
              ) : (
                <HStack wrap="wrap" spacing={2} mt={2}>
                  {doneOrders.map((order) => {
                    const seat = Number(order.seat_number);
                    return (
                      <Box key={order.id ?? seat} px={3} py={2} borderRadius="md" border="1px solid" borderColor="gray.300" backgroundColor="green.100">
                        <Text fontWeight="bold">席 {seat}</Text>
                      </Box>
                    );
                  })}
                </HStack>
              )}
            </VStack>
          </Box>
        </SimpleGrid>
      </Box>

      {/* ページ埋め込み: 調理完了表示の下（ページ右下寄せ）に配置 */}
      <Box mt={4} display="flex" justifyContent="flex-end">
        <MyReceiveButton />
      </Box>
    </Box>
  );
}