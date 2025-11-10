'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/supabase-client';

type Contact = {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  // Supabaseからデータ取得
  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      alert('データ取得エラー: ' + error.message);
    } else {
      setContacts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // 削除機能
  const handleDelete = async (id: number) => {
    if (!confirm('本当に削除しますか？')) return;
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) {
      alert('削除エラー: ' + error.message);
    } else {
      setContacts(contacts.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">お問い合わせ管理</h1>
      {loading ? (
        <p>読み込み中...</p>
      ) : contacts.length === 0 ? (
        <p>問い合わせはありません。</p>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <div key={contact.id} className="border p-4 rounded shadow flex justify-between items-start">
              <div>
                <p><span className="font-bold">名前:</span> {contact.name}</p>
                <p><span className="font-bold">メール:</span> {contact.email}</p>
                <p><span className="font-bold">内容:</span> {contact.message}</p>
                <p className="text-sm text-gray-500">{new Date(contact.created_at).toLocaleString()}</p>
              </div>
              <button
                onClick={() => handleDelete(contact.id)}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
