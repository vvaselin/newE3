"use client";

import React, { useEffect, useState, useCallback } from "react";
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

type Order = {
  seat_number: number;
  paid_at: string; // Supabase returns ISO string for timestamptz
};

const MIN_SEAT = 1;
const MAX_SEAT = 10;

// 閾値（分）
// 調理中 -> 調理済み になる時間（3分）
const COOK_DONE_MIN = 3;
// 表示削除（経過後削除）：10分
const REMOVE_MIN = 10;

// ポーリング間隔（ミリ秒）— UI リアクティブにするため短めにしてあるが、環境に応じて長くする
const POLL_INTERVAL_MS = 15 * 1000; // 15秒

export default function OrderStatePage() {
  const toast = useToast();

  const [seatInput, setSeatInput] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // DB から全注文を取得
  const fetchOrders = useCallback(async (): Promise<Order[]> => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("seat_number", { ascending: true });

      if (error) {
        console.error("fetchOrders error", error);
        return [];
      }
  return (data as Order[]) ?? [];
    } catch (err) {
      console.error("fetchOrders unexpected error", err);
      return [];
    }
  }, []);

  // 決済完了（登録） — upsert を使う（既存があれば上書き）
  const registerPayment = useCallback(
    async (seatNumber: number) => {
      try {
        setLoading(true);
        const nowIso = new Date().toISOString();
        const { error } = await supabase
          .from("orders")
          .upsert([{ seat_number: seatNumber, paid_at: nowIso }], {
            onConflict: "seat_number",
          });

        if (error) {
          console.error("registerPayment error", error);
          toast({
            title: "登録に失敗しました",
            description: error.message,
            status: "error",
            duration: 4000,
            isClosable: true,
          });
          return;
        }
        toast({
          title: "決済完了を登録しました",
          description: `席 ${seatNumber} の決済時刻を ${new Date(nowIso).toLocaleTimeString()} に設定しました。`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        // upsert 成功直後に一時的に state を更新して UX を良くする例
        setOrders((prev) => {
          const nowIso = new Date().toISOString();
          const exists = prev.some((o) => o.seat_number === seatNumber);
          if (exists) {
            return prev.map((o) =>
              o.seat_number === seatNumber ? { seat_number: seatNumber, paid_at: nowIso } : o
            );
          } else {
            return [...prev, { seat_number: seatNumber, paid_at: nowIso }];
          }
        });

        const newOrders = await fetchOrders();
        setOrders(newOrders);
      } finally {
        setLoading(false);
      }
    },
    [fetchOrders, toast]
  );

  // 指定座席を削除（表示・DB から削除）
  const deleteOrder = useCallback(async (seatNumber: number) => {
    try {
      const { error } = await supabase.from("orders").delete().eq("seat_number", seatNumber);
      if (error) {
        console.error("deleteOrder error", error);
        toast({ title: "削除に失敗しました", description: error.message, status: "error" });
      }
    } catch (err) {
      console.error("deleteOrder unexpected", err);
      toast({ title: "削除中にエラーが発生しました", status: "error" });
    }
  }, [toast]);

  // 時刻差を分で計算
  const minutesSince = (iso: string | null | undefined) => {
    if (!iso) return Number.POSITIVE_INFINITY;
    const paidAtNum = new Date(iso).getTime();
    if (isNaN(paidAtNum)) return Number.POSITIVE_INFINITY;
    const now = Date.now();
    return Math.floor((now - paidAtNum) / (1000 * 60));
  };

  // 状態分け：調理中 / 調理済み / 削除（>= REMOVE_MIN）
  const categorizeOrders = useCallback(
    (rows: Order[]) => {
      const cooking: number[] = []; // 調理中（0..COOK_DONE_MIN-1） -> ここでは 0..2 分 = 調理中
      const done: number[] = []; // 調理済み（>= COOK_DONE_MIN and < REMOVE_MIN）
      const toRemove: number[] = []; // >= REMOVE_MIN

      for (const r of rows) {
        const mins = minutesSince(r.paid_at);
        if (mins >= REMOVE_MIN) {
          toRemove.push(r.seat_number);
        } else if (mins >= COOK_DONE_MIN) {
          done.push(r.seat_number);
        } else {
          cooking.push(r.seat_number);
        }
      }

      // 並び替え
      cooking.sort((a, b) => a - b);
      done.sort((a, b) => a - b);

      return { cooking, done, toRemove };
    },
    []
  );

  // 全体更新：取得→分類→必要なら削除→ state 更新
  const refreshAndSync = useCallback(async () => {
    try {
      const rows = await fetchOrders();
      const { cooking, done, toRemove } = categorizeOrders(rows);

      // 削除対象があれば並列で削除
      if (toRemove.length > 0) {
        await Promise.all(toRemove.map((s) => deleteOrder(s)));
      }

      // 再取得して state にセット（確実に DB と一致させる）
      const latest = await fetchOrders();
      setOrders(latest);
    } catch (err) {
      console.error("refreshAndSync error", err);
    }
  }, [fetchOrders, categorizeOrders, deleteOrder]);

  // 起動時に一回読み込み
  useEffect(() => {
    let mounted = true;
    (async () => {
      const initial = await fetchOrders();
      if (!mounted) return;
      setOrders(initial);
    })();
    return () => {
      mounted = false;
    };
  }, [fetchOrders]);

  // ポーリングで定期更新（クリーンアップあり）
  useEffect(() => {
    // 初回更新
    refreshAndSync();
    const id = setInterval(() => {
      refreshAndSync();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [refreshAndSync]);

  // UI で使うリスト（毎回算出）
  const { cooking: cookingList, done: doneList } = categorizeOrders(orders);

  // 入力の検証と登録トリガー
  const handleRegisterClick = async () => {
    const seatNum = Number(seatInput);
    if (!Number.isInteger(seatNum) || seatNum < MIN_SEAT || seatNum > MAX_SEAT) {
      toast({
        title: "無効な席番号",
        description: `席番号は ${MIN_SEAT} 〜 ${MAX_SEAT} の整数で入力してください。`,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    await registerPayment(seatNum);
    setSeatInput("");
  };

  return (
    <Box p={6}>
      <Heading mb={4}>注文状態（Order State）</Heading>

      {/* 上部：入力と決済完了 */}
      <HStack spacing={3} mb={6}>
        <Text>席番号：</Text>
        <Input
          value={seatInput}
          onChange={(e) => setSeatInput(e.target.value)}
          placeholder={`1〜${MAX_SEAT}`}
          type="number"
          width="120px"
        />
        <Button colorScheme="green" onClick={handleRegisterClick} isLoading={loading}>
          決済完了
        </Button>
        <Button
          onClick={async () => {
            // 手動で全削除（デバッグ用）
            if (!confirm("全ての注文を削除しますか？")) return;
            const rows = await fetchOrders();
            await Promise.all(rows.map((r) => deleteOrder(r.seat_number)));
            const latest = await fetchOrders();
            setOrders(latest);
            toast({ title: "テーブルをクリアしました", status: "info", duration: 2000 });
          }}
        >
          全削除（debug）
        </Button>
      </HStack>

      {/* 中央：左右分割、中央に縦線 */}
      <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
        <SimpleGrid columns={2} spacing={4} alignItems="start">
          {/* 左側：調理中 */}
          <VStack align="stretch">
            <Heading size="md">調理中</Heading>
            <Divider />
            {cookingList.length === 0 ? (
              <Text color="gray.500">現在、調理中の注文はありません。</Text>
            ) : (
              <HStack wrap="wrap" spacing={2} mt={2}>
                {cookingList.map((s) => (
                  <Box
                    key={s}
                    px={3}
                    py={2}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.300"
                    backgroundColor="yellow.100"
                  >
                    <Text fontWeight="bold">席 {s}</Text>
                    <Text fontSize="xs" color="gray.600">
                      {/* オプションで経過時間を表示 */}
                      {(() => {
                        const order = orders.find((o) => o.seat_number === s);
                        return order ? `${minutesSince(order.paid_at)} 分経過` : "";
                      })()}
                    </Text>
                  </Box>
                ))}
              </HStack>
            )}
          </VStack>

          {/* 右側：調理済み */}
          <VStack align="stretch">
            <Heading size="md">調理済み</Heading>
            <Divider />
            {doneList.length === 0 ? (
              <Text color="gray.500">現在、調理済みの注文はありません。</Text>
            ) : (
              <HStack wrap="wrap" spacing={2} mt={2}>
                {doneList.map((s) => (
                  <Box
                    key={s}
                    px={3}
                    py={2}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.300"
                    backgroundColor="green.100"
                  >
                    <Text fontWeight="bold">席 {s}</Text>
                    <Text fontSize="xs" color="gray.600">
                      {(() => {
                        const order = orders.find((o) => o.seat_number === s);
                        return order ? `${minutesSince(order.paid_at)} 分経過` : "";
                      })()}
                    </Text>
                  </Box>
                ))}
              </HStack>
            )}
          </VStack>
        </SimpleGrid>

        {/* 真ん中に縦線（SimpleGrid の中央境界に合わすための装飾） */}
        <Box
          position="relative"
          aria-hidden
          _after={{
            content: '""',
            position: "absolute",
            left: "50%",
            top: 8,
            bottom: 8,
            width: "1px",
            background: "gray.200",
            transform: "translateX(-50%)",
          }}
        />
      </Box>
    </Box>
  );
}
