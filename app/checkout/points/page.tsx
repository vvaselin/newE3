'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Button, Container, Divider, Heading, HStack, Input, Select, Text, VStack, useToast,
  AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
} from '@chakra-ui/react';
// ↓ Supabaseクライアントをインポート
import { createClient } from '@/utils/supabase/client'; // client.ts を使う
import type { User } from '@supabase/supabase-js';

type CartItem = { id: string; name: string; price: number; quantity: number; image?: string; };

const CART_STORAGE_KEY = 'newE3_cart';
// ↓ localStorageのポイントキーは不要になる
// const POINTS_STORAGE_KEY = 'newE3_points';
const REMAINING_STORAGE_KEY = 'newE3_remaining';

export default function CheckoutPointsPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ownedPoints, setOwnedPoints] = useState<number>(0); // DBから取得したポイント
  const [usePoints, setUsePoints] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // ログインユーザー情報
  const [isLoading, setIsLoading] = useState(true); // ポイント取得中のローディング状態

  const [isOpen, setIsOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const toast = useToast();
  const supabase = createClient(); // Supabaseクライアントを初期化

  // --- ★ 修正点 1: ポイント取得ロジック ---
  useEffect(() => {
    // カート情報をlocalStorageから読み込む
    try {
      const rawCart = localStorage.getItem(CART_STORAGE_KEY);
      setCart(rawCart ? JSON.parse(rawCart) : []);
    } catch {
      setCart([]);
    }

    // ログインユーザーとポイントを取得する非同期関数
    const fetchUserAndPoints = async () => {
      setIsLoading(true); // ローディング開始
      // 1. 現在のログインユーザーを取得
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('ユーザーが取得できませんでした:', userError);
        toast({ title: 'ログインが必要です', status: 'error', duration: 3000 });
        // 必要に応じてログインページへリダイレクト
        // router.push('/login');
        setIsLoading(false);
        return;
      }
      setCurrentUser(user); // ユーザー情報をStateに保存

      // 2. profilesテーブルからポイントを取得
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('point') // pointカラムを取得
        .eq('id', user.id) // ログインユーザーのIDで絞り込み
        .single(); // 結果は1行のはず

      if (profileError) {
        console.error('ポイントの取得に失敗:', profileError);
        setOwnedPoints(0); // エラー時は0ポイントとする
      } else if (profile) {
        setOwnedPoints(profile.point ?? 0); // 取得したポイントをStateにセット (nullなら0)
      } else {
        setOwnedPoints(0); // プロファイルが見つからない場合も0
      }
      setIsLoading(false); // ローディング完了
    };

    fetchUserAndPoints(); // 関数を実行

    // 残額ヒントの読み込み（これはlocalStorageのままでも良い）
    const rem = localStorage.getItem(REMAINING_STORAGE_KEY);
    // setRemainingHint(Number.isFinite(Number(rem)) && Number(rem) > 0 ? Number(rem) : null);

  }, [supabase, toast, router]); // 依存配列に supabase, toast, router を追加
  // --- ここまで修正点 1 ---

  const total = useMemo(() => cart.reduce((s, it) => s + it.price * it.quantity, 0), [cart]);
  const maxUsable = useMemo(() => Math.min(ownedPoints, total), [ownedPoints, total]);
  const remain = useMemo(() => Math.max(0, total - usePoints), [total, usePoints]);
  const canPay = useMemo(() => usePoints > 0 && usePoints <= maxUsable, [usePoints, maxUsable]);

  const openConfirm = () => {
    if (!currentUser) {
       toast({ title: 'ログインが必要です', status: 'error', duration: 1500 });
       return;
    }
    if (!canPay) {
      toast({ title: '使用ポイントを確認してください', status: 'warning', duration: 1500, isClosable: true, position: 'top' });
      return;
    }
    setIsOpen(true);
  };

  // --- ★ 修正点 2: ポイント更新ロジック ---
  const onConfirm = async () => { // asyncを追加
    if (!currentUser) return; // ユーザーがいない場合は何もしない

    setIsSubmitting(true);

    const newOwnedPoints = ownedPoints - usePoints; // 新しいポイント残高

    // Supabaseのprofilesテーブルを更新
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ point: newOwnedPoints }) // pointカラムを更新
      .eq('id', currentUser.id); // 対象ユーザーのIDを指定

    setIsOpen(false); // 先にダイアログを閉じる

    if (updateError) {
      console.error('ポイント更新エラー:', updateError);
      toast({
        title: 'ポイントの更新に失敗しました',
        description: updateError.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
      return; // エラーならここで処理中断
    }

    // --- orders 登録 (サーバー API を呼ぶ) ---
    // 1) seat を localStorage から読み出す
    let seatRaw: string | null = null;
    try {
      seatRaw = localStorage.getItem('newE3_seat');
    } catch (e) {
      // ignore
    }

    if (!seatRaw) {
      toast({ title: '座席情報が見つかりませんでした', status: 'error', duration: 3000 });
      // 部分支払い/全額処理の後の遷移はここで制御
      setIsSubmitting(false);
      return;
    }

    const seatNumber = Number(seatRaw);
    if (!Number.isInteger(seatNumber) || seatNumber < 1) {
      toast({ title: '座席番号が不正です', status: 'error', duration: 3000 });
      setIsSubmitting(false);
      return;
    }

    try {
      const resp = await fetch('/api/orders/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatNumber }),
      });
      const j = await resp.json();
      if (!resp.ok || j.error) {
        console.error('order register error', j);
        toast({ title: '注文登録に失敗しました', description: j?.error ?? 'unknown', status: 'error', duration: 4000 });
        setIsSubmitting(false);
        return;
      }
      // 登録成功: サーバーが upsert した行（paid_at を含む）を返す
      const registeredRow = j.row;
      console.debug('registered order', registeredRow);
    } catch (err) {
      console.error('order register fetch error', err);
      toast({ title: '注文登録に失敗しました', status: 'error', duration: 4000 });
      setIsSubmitting(false);
      return;
    }

    // 更新成功時の処理 (localStorageの更新は削除)
    if (remain > 0) {
      // 残額あり：部分支払い（カート維持）
      localStorage.setItem(REMAINING_STORAGE_KEY, String(remain));
      toast({
        title: 'ポイント支払い（部分）',
        description: `使用 ${usePoints.toLocaleString()} 円 / 残額 ¥${remain.toLocaleString()} を他方式でお支払いください`,
        status: 'success', duration: 2400, isClosable: true, position: 'top',
      });
      router.push('/checkout');
    } else {
      // 全額ポイント：完了 → カートクリア
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(REMAINING_STORAGE_KEY);
      toast({
        title: 'ポイントで支払いました',
        description: `使用 ${usePoints.toLocaleString()} 円 / 残ポイント ${newOwnedPoints.toLocaleString()} 円`,
        status: 'success', duration: 2000, isClosable: true, position: 'top',
      });
      // 注文表示ページへ遷移
      router.push('/orderState');
    }

    setIsSubmitting(false);
  };
  // --- ここまで修正点 2 ---

  return (
    <Container maxW="container.lg" py={10}>
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">決済（ポイント払い）</Heading>
        {/* 戻るボタンは checkout ページへ */}
        <Button variant="ghost" onClick={() => router.push('/checkout')}>決済方法へ戻る</Button>
      </HStack>

      {/* --- ★ 修正点 3: ローディング表示 --- */}
      {isLoading ? (
        <Text>ポイント情報を読み込み中...</Text>
      ) : (
        <>
          {/* ご注文表示 */}
          <Box borderWidth="1px" borderRadius="lg" p={6}>
            <Heading as="h2" size="md" mb={3}>ご注文</Heading>
            {cart.length === 0 ? (
              <Text color="gray.500">カートが空です。</Text>
            ) : (
              <VStack align="stretch" spacing={3} divider={<Divider />}>
                {cart.map((it) => (
                  <HStack key={it.id} justify="space-between">
                    <Box><Text fontWeight="bold">{it.name}</Text><Text fontSize="sm">数量 {it.quantity}</Text></Box>
                    <Text fontWeight="bold">¥{(it.price * it.quantity).toLocaleString()}</Text>
                  </HStack>
                ))}
                <HStack justify="space-between" pt={1}>
                  <Text>合計</Text><Text fontWeight="bold">¥{total.toLocaleString()}</Text>
                </HStack>
              </VStack>
            )}
          </Box>

          {/* ポイント入力・支払い実行 */}
          <Box borderWidth="1px" borderRadius="lg" p={6} mt={6}>
            <Heading as="h2" size="md" mb={3}>ポイント</Heading>
            <Text>
              所持ポイント（円相当）：<b>{ownedPoints.toLocaleString()}</b> 円（最大使用可：{maxUsable.toLocaleString()} 円）
            </Text>

            <HStack mt={3} spacing={3}>
              <Input
                type="number"
                inputMode="numeric"
                value={usePoints}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v)) return;
                  // 入力値が0未満、または最大使用可能ポイントを超えないように制限
                  setUsePoints(Math.max(0, Math.min(v, maxUsable)));
                }}
                placeholder="使用額を入力（例：500）"
                max={maxUsable} // HTML5のmax属性も設定
                min={0}         // HTML5のmin属性も設定
              />
              {/* クイック選択は最大値のみに変更 */}
              <Button variant="outline" onClick={() => setUsePoints(maxUsable)}>最大額を使用</Button>
            </HStack>

            <HStack justify="space-between" mt={3}>
              <Text>ポイント使用後の残額</Text>
              <Text fontWeight="bold" fontSize="lg" color={remain > 0 ? 'orange.500' : 'green.500'}>
                ¥{remain.toLocaleString()}
              </Text>
            </HStack>

            <Button
              colorScheme="teal"
              size="lg"
              mt={5}
              w="full"
              onClick={openConfirm}
              // isDisabled条件を整理: ポイント使用額が0より大きい & カートが空でない & ログインしている
              isDisabled={usePoints <= 0 || cart.length === 0 || !currentUser}
              title={!currentUser ? 'ログインが必要です' : (cart.length === 0 ? 'カートが空です' : (usePoints <= 0 ? '使用ポイントを入力してください' : undefined))}
            >
              ポイントで支払う（{usePoints.toLocaleString()} 円）
            </Button>
            {/* 戻るボタンはヘッダーに移動したので削除 */}
            {/* <Button variant="ghost" mt={2} w="full" onClick={() => router.back()}> 戻る </Button> */}
          </Box>
        </>
      )}
      {/* --- ここまで修正点 3 --- */}


      {/* 確認ダイアログ (変更なし) */}
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={() => setIsOpen(false)}>
        {/* ... (AlertDialogの内容は変更なし) ... */}
         <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>決済の確認</AlertDialogHeader>
            <AlertDialogBody>
              <VStack align="stretch" spacing={1}>
                <HStack justify="space-between"><Text>合計</Text><Text fontWeight="bold">¥{total.toLocaleString()}</Text></HStack>
                <HStack justify="space-between"><Text>使用ポイント</Text><Text fontWeight="bold">¥{usePoints.toLocaleString()}</Text></HStack>
                <Divider />
                <HStack justify="space-between">
                  <Text>支払い後の残額</Text>
                  <Text fontWeight="bold" color={remain > 0 ? 'orange.500' : 'green.500'}>
                    ¥{remain.toLocaleString()}
                  </Text>
                </HStack>
              </VStack>
              <Text mt={2} fontSize="sm" color="gray.600">
                {remain > 0 ? '残額は他の方法でお支払いください。' : '全額ポイントでお支払いできます。'}
              </Text>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsOpen(false)}>キャンセル</Button>
              <Button colorScheme="teal" onClick={onConfirm} ml={3}>実行する</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
}