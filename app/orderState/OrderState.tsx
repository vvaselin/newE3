// app/orderState/OrderState.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Input,
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
const MIN_SEAT = 1;
const MAX_SEAT = 10;
const COOK_MIN = 3; // 分
const DONE_MIN = 5; // 分
const REMOVE_MIN = COOK_MIN + DONE_MIN; // 分

const POLL_INTERVAL_MS = 5 * 1000; // 5秒ポーリング
const TICK_MS = 1000; // 秒ごとにUI更新
const ORDERS_CACHE_KEY = "orders_cache_v1";

type OrderRow = {
  seat_number: number | string;
  paid_at: string; // ISO
};

// NOTE: per-seat receive buttons removed. A single "自分の注文商品を受け取る" button
// is shown in the admin area and navigates to `/receive`.

/**
 * 固定表示の「自分の注文商品を受け取る」ボタン
 * 画面を上下左右で4分割したときの右下に表示されるように固定する
 */
function MyReceiveButton() {
  const router = useRouter();
  return (
    <Button
      colorScheme="blue"
      onClick={() => router.push('/receive')}
      position="fixed"
      right="24px"
      bottom="24px"
      size="md"
      zIndex={40}
    >
      自分の注文商品を受け取る
    </Button>
  );
}

export default function OrderState() {
  const toast = useToast();
  const router = useRouter();

  // --- state ---
  const [seatInput, setSeatInput] = useState<string>("");
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

  const deleteOrder = useCallback(async (seatNumber: number) => {
    try {
      const { error } = await supabase.from("orders").delete().eq("seat_number", seatNumber);
      if (error) console.error("deleteOrder error:", error);
    } catch (err) {
      console.error("deleteOrder unexpected:", err);
    }
  }, []);

  // ----- 表示分類 -----
  const categorizeOrders = useCallback((rows: OrderRow[]) => {
    const cooking: number[] = [];
    const done: number[] = [];
    const toRemove: number[] = [];

    const cookMs = COOK_MIN * 60 * 1000;
    const removeMs = REMOVE_MIN * 60 * 1000;

    for (const r of rows) {
      const seatNum = Number(r.seat_number);
      if (Number.isNaN(seatNum)) continue;
      const ms = elapsedMs(r.paid_at);
      if (ms >= removeMs) toRemove.push(seatNum);
      else if (ms >= cookMs) done.push(seatNum);
      else cooking.push(seatNum);
    }

    cooking.sort((a, b) => a - b);
    done.sort((a, b) => a - b);
    return { cooking, done, toRemove };
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

  // ----- 登録 (楽観更新 + サーバー登録) -----
  const registerPayment = useCallback(async (seatNumber: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatNumber }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("registerPayment api error:", json);
        toast({ title: "登録に失敗しました", description: json?.error || "unknown error", status: "error", duration: 4000, isClosable: true });
        return;
      }

      toast({ title: "決済完了を登録しました", description: `席 ${seatNumber} の決済を登録しました。`, status: "success", duration: 3000, isClosable: true });

      const serverRow = json?.row as OrderRow | undefined;
      const newOrder = serverRow ?? { seat_number: seatNumber, paid_at: new Date().toISOString() };

      setOrders((prev) => {
        const filtered = prev.filter((o) => Number(o.seat_number) !== seatNumber);
        const merged = [...filtered, newOrder].sort((a, b) => Number(a.seat_number) - Number(b.seat_number));
        try { localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(merged)); } catch {}
        return merged;
      });

      // 非同期でサーバーから再取得して最終確定
      (async () => {
        try {
          const latest = await fetchOrders();
          setOrders((prev) => {
            const merged = mergeLatestAndPrev(latest, prev);
            try { localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(merged)); } catch {}
            return merged;
          });
        } catch (err) {
          console.error("post-register sync failed:", err);
        }
      })();
    } finally {
      setLoading(false);
    }
  }, [fetchOrders, toast]);

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

  // 表示データ
  const { cooking: cookingList, done: doneList } = categorizeOrders(orders);

  // 登録ボタンハンドラ
  const handleRegisterClick = async () => {
    const seatNum = Number(seatInput);
    if (!Number.isInteger(seatNum) || seatNum < MIN_SEAT || seatNum > MAX_SEAT) {
      toast({ title: "無効な席番号です", description: `席番号は ${MIN_SEAT} ～ ${MAX_SEAT} の整数で入力してください。`, status: "warning", duration: 3000, isClosable: true });
      return;
    }
    await registerPayment(seatNum);
    setSeatInput("");
  };

  return (
    <Box p={6}>
      {/* 管理者操作領域 */}
      <HStack spacing={3} mb={6}>
        <Text>席番号：</Text>
        <Input value={seatInput} onChange={(e) => setSeatInput(e.target.value)} placeholder={`1〜${MAX_SEAT}`} type="number" width="120px" />
        <Button colorScheme="green" onClick={handleRegisterClick} isLoading={loading}>決済完了</Button>

        <Button onClick={async () => {
          if (!confirm("全ての注文を削除しますか？")) return;
          const rows = await fetchOrders();
          await Promise.all(rows.map((r) => deleteOrder(Number(r.seat_number))));
          const latest = await fetchOrders();
          setOrders(latest);
          try { localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(latest)); } catch {}
          toast({ title: "全削除しました", status: "info", duration: 2000 });
        }}>全削除（debug）</Button>
      </HStack>

      {/* 利用者向け: 受け取りボタンは画面右下に固定表示する（MyReceiveButton） */}

      {/* 表示領域 */}
      <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
        <SimpleGrid columns={2} spacing={4} alignItems="start">
          {/* 調理中 */}
          <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3}>
            <VStack align="stretch">
              <Heading size="md">調理中 （{COOK_MIN}分以内）</Heading>
              <Divider />
              {cookingList.length === 0 ? (
                <Text color="gray.500">現在、調理中の注文はありません。</Text>
              ) : (
                <HStack wrap="wrap" spacing={2} mt={2}>
                  {cookingList.map((s) => {
                    const order = orders.find((o) => Number(o.seat_number) === s);
                    return (
                      <Box key={s} px={3} py={2} borderRadius="md" border="1px solid" borderColor="gray.300" backgroundColor="yellow.100">
                        <Text fontWeight="bold">席 {s}</Text>
                        <Text fontSize="xs" color="gray.600">{order ? `${formatElapsed(order.paid_at)} 経過` : "-"}</Text>
                        {/* per-seat receive buttons removed - use the single '自分の注文商品を受け取る' ボタン above */}
                      </Box>
                    );
                  })}
                </HStack>
              )}
            </VStack>
          </Box>

          {/* 調理済み */}
          <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3}>
            <VStack align="stretch">
              <Heading size="md">調理済み （{DONE_MIN}分表示）</Heading>
              <Divider />
              {doneList.length === 0 ? (
                <Text color="gray.500">現在、調理済みの注文はありません。</Text>
              ) : (
                <HStack wrap="wrap" spacing={2} mt={2}>
                  {doneList.map((s) => {
                    const order = orders.find((o) => Number(o.seat_number) === s);
                    return (
                      <Box key={s} px={3} py={2} borderRadius="md" border="1px solid" borderColor="gray.300" backgroundColor="green.100">
                        <Text fontWeight="bold">席 {s}</Text>
                        <Text fontSize="xs" color="gray.600">{order ? `${formatElapsed(order.paid_at)} 経過` : "-"}</Text>
                        {/* per-seat receive buttons removed - use the single '自分の注文商品を受け取る' ボタン above */}
                      </Box>
                    );
                  })}
                </HStack>
              )}
            </VStack>
          </Box>
        </SimpleGrid>

        {/* 中央の区切り線 */}
        <Box position="relative" aria-hidden _after={{ content: '""', position: "absolute", left: "50%", top: 8, bottom: 8, width: "1px", background: "gray.200", transform: "translateX(-50%)" }} />
        {/* 固定表示ボタン（画面右下） */}
        <MyReceiveButton />
      </Box>
    </Box>
  );
}