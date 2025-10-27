import MenuPageClient from './MenuPageClient';
import {supabase} from "@/supabase-client";

// メニューアイテムの型定義
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

async function getMenuItems(): Promise<MenuItem[]> {
  const { data: foods, error } = await supabase
    .from('foods')
    .select('*')
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