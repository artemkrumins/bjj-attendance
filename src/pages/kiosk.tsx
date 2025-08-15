import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { windowAroundNow, fmt } from '../lib/date';

type Session = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: 'SCHEDULED' | 'CANCELED' | 'FINISHED';
  class_template: { name: string; category: 'ADULT'|'KID'|'OPEN' };
  coach: { first_name: string; last_name: string } | null;
};

type Student = {
  user_id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  role: 'ADMIN'|'COACH'|'STUDENT';
};

export default function Kiosk() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [q, setQ] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>('');

  // Загружаем "текущие" занятия (сейчас ± окно)
  useEffect(() => {
    const { from, to } = windowAroundNow(60, 120);
    supabase
      .from('class_session')
      .select('id, starts_at, ends_at, status, class_template:template_id(name,category), coach:coach_id(first_name,last_name)')
      .gte('starts_at', from.toISOString())
      .lte('starts_at', to.toISOString())
      .eq('status','SCHEDULED')
      .order('starts_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) { setMessage(error.message); return; }
        setSessions((data ?? []) as any);
        if ((data ?? []).length > 0) setSessionId((data as any)[0].id);
      });
  }, []);

  // Поиск студентов (минимизация PII в UI остаётся: показываем только ФИО и год)
  useEffect(() => {
    if (!q || q.trim().length < 1) { setStudents([]); return; }
    // тренер/админ могут видеть студентов; студенты не должны открывать /kiosk
    supabase
      .from('user_profile')
      .select('user_id, first_name, last_name, birth_date, role')
      .eq('role','STUDENT')
      .or(`last_name.ilike.%${q}%,first_name.ilike.%${q}%`)
      .order('last_name', { ascending: true })
      .limit(50)
      .then(({ data, error }) => {
        if (error) { setMessage(error.message); return; }
        setStudents((data ?? []) as any);
      });
  }, [q]);

  async function checkIn(studentId: string) {
    if (!sessionId) { setMessage('Выберите занятие'); return; }
    setBusy(true);
    const { error } = await supabase
      .from('attendance')
      .insert({ session_id: sessionId, student_id: studentId, status: 'PRESENT', source: 'KIOSK' });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setMessage('Отметка сохранена ✅');
    setQ('');
    setStudents([]);
    setTimeout(()=>setMessage(''), 1500);
  }

  const nowList = useMemo(() => sessions.map(s => ({
    id: s.id,
    label: `${s.class_template?.name || 'Занятие'} — ${fmt(s.starts_at)}–${fmt(s.ends_at)}`
  })), [sessions]);

  return (
    <main style={{ padding: 16, fontFamily: 'system-ui', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28 }}>КИОСК • Отметка посещения</h1>

      <section style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
        <label>Текущее занятие:&nbsp;</label>
        <select value={sessionId} onChange={e=>setSessionId(e.target.value)} style={{ fontSize: 18 }}>
          {nowList.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        {sessions.length === 0 && <span style={{ color: '#b00' }}>Нет активных занятий в ближайшее время</span>}
      </section>

      <section style={{ marginTop: 24 }}>
        <label style={{ fontSize: 20 }}>Найдите себя по фамилии или имени</label>
        <input
          autoFocus
          placeholder="Начните вводить фамилию/имя..."
          value={q}
          onChange={e=>setQ(e.target.value)}
          style={{ display: 'block', width: '100%', padding: 14, fontSize: 22, marginTop: 8 }}
        />
      </section>

      {message && <p style={{ marginTop: 12, color: '#0a0' }}>{message}</p>}

      <ul style={{ marginTop: 12, listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {students.map(st => {
          const year = st.birth_date ? new Date(st.birth_date).getFullYear() : '';
          return (
            <li key={st.user_id} style={{ border: '2px solid #222', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{st.last_name} {st.first_name}</div>
              <div style={{ opacity: .7, marginTop: 4 }}>{year ? `Год рождения: ${year}` : '—'}</div>
              <button disabled={busy} onClick={()=>checkIn(st.user_id)} style={{ marginTop: 10, width: '100%', padding: 12, fontSize: 18 }}>
                Отметиться
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
