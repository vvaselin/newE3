import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div style={{ padding: 40, textAlign: 'center', maxWidth: 500, margin: 'auto' }}>
      <h1 style={{ color: 'red' }}>認証に失敗しました</h1>
      <p style={{ margin: '20px 0' }}>
        認証リンクが無効であるか、有効期限が切れています。
        お手数ですが、再度お試しください。
      </p>
      <Link
        href="/login"
        style={{
          display: 'inline-block',
          padding: '12px 20px',
          background: '#888',
          color: 'white',
          textDecoration: 'none',
          borderRadius: 5,
        }}
      >
        ログインページへ戻る
      </Link>
    </div>
  )
}