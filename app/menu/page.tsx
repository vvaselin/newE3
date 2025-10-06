import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';
import MenuPageClient from './MenuPageClient';

// メニューアイテムの型定義
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

async function getMenuItems(): Promise<MenuItem[]> {
  const filePath = path.join(process.cwd(), 'data', 'menu.csv');
  const csvFile = await fs.readFile(filePath, 'utf-8');

  return new Promise((resolve) => {
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        const menuItems: MenuItem[] = data.map(item => ({
          ...item,
          price: Number(item.price),
        }));
        resolve(menuItems);
      },
    });
  });
}

export default async function MenuPage() {
  const menuItems = await getMenuItems();
  
  return <MenuPageClient menuItems={menuItems} />;
}