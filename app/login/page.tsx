'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage('エラー: ' + error.message)
    } else {
      // ログイン成功時、トップページまたはダッシュボードにリダイレクト
      router.push('/')
      router.refresh() // サーバーコンポーネントを再読み込みさせる
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setMessage('エラー: ' + authError.message)
      return
    }

    if (!authData.user) {
      setMessage('エラー: ユーザーが作成されませんでした。')
      return
    }

    // サインアップ成功時、profilesテーブルにも挿入
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ 
        id: authData.user.id,  // 認証ユーザーと同じIDを使用
        email: authData.user.email
      })

    if (profileError) {
      // プロファイル作成失敗（例: RLS違反など）
      setMessage('エラー (Profile): ' + profileError.message)
      // ここで auth.deleteUser などでロールバックする方が親切かもしれない
    } else {
      setMessage('確認メールを送信しました。メール内のリンクをクリックしてください。')
    }
  }

  return (
    <div style={{ padding: 40, maxWidth: 400, margin: 'auto' }}>
      <h1>ログイン / 新規登録</h1>
      <form>
        <div style={{ margin: '10px 0' }}>
          <label htmlFor="email">メールアドレス: </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ margin: '10px 0' }}>
          <label htmlFor="password">パスワード: </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={handleLogin}
            style={{ padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            ログイン
          </button>
          <button
            onClick={handleSignUp}
            style={{ padding: '10px 15px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            新規登録
          </button>
        </div>
      </form>
      {message && <p style={{ color: message.startsWith('エラー') ? 'red' : 'green', marginTop: 15 }}>{message}</p>}
    </div>
  )
}