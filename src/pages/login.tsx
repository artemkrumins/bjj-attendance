import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
      return;
    }
    r.push('/dashboard');
  }

  return (
    <main style={{padding: 24, fontFamily: 'sans-serif', maxWidth: 360}}>
      <h1>Вход</h1>
      <form onSubmit={onSubmit}>
        <label>Email<br/>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
        </label>
        <br/><br/>
        <label>Пароль<br/>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
        </label>
        <br/><br/>
        <button type="submit">Войти</button>
      </form>
    </main>
  );
}
