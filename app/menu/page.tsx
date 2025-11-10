import MenuPageClient from './MenuPageClient';
import { supabase } from '@/supabase-client';

// メニューアイテムの型定義
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  Display?: boolean;
  genre?: string | null; // ★ Supabaseのfoods.genreを受け取る（日本語表示はクライアント側で変換）
}

async function getMenuItems(): Promise<MenuItem[]> {
  const { data: foods, error } = await supabase
    .from('foods')
    .select('*')          // genre もここで取得される
    .eq('display', true)
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }

  return foods || [];
}

export default async function MenuPage() {
  const menuItems = await getMenuItems();
  return <MenuPageClient menuItems={menuItems} />;
}
