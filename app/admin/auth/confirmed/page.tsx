import Link from 'next/link'

export default function AuthConfirmedPage() {
  return (
    <div style={{ padding: 40, textAlign: 'center', maxWidth: 500, margin: 'auto' }}>
      <h1>メールアドレスの認証が完了しました</h1>
      <p style={{ margin: '20px 0' }}>
        アカウントが有効化されました。
        ログインしてサービスをご利用ください。
      </p>
      <Link
        href="/login"
        style={{
          display: 'inline-block',
          padding: '12px 20px',
          background: '#007bff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: 5,
        }}
      >
        ログインページへ
      </Link>
    </div>
  )
}