import Link from 'next/link';

export default function Home() {
  return (
    <main style={{padding: 24, fontFamily: 'sans-serif'}}>
      <h1>BJJ Academy Latvia</h1>
      <p>Веб‑приложение запущено. Дальше подключим авторизацию Supabase и страницы.</p>
      <ul>
        <li><Link href="/login">Войти</Link></li>
        <li><Link href="/kiosk">Киоск (демо)</Link></li>
      </ul>
    </main>
  );
}
