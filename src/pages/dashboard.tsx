import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  return (
    <main style={{padding: 24, fontFamily: 'sans-serif'}}>
      <h1>Личный кабинет</h1>
      {email ? <p>Вы вошли как {email}</p> : <p>Нет сессии</p>}
    </main>
  );
}
