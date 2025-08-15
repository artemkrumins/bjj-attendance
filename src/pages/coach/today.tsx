import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { windowAroundNow, fmt } from '../../lib/date';

export default function CoachToday() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [roster, setRoster] = useState<Record<string, number>>({});

  useEffect(() => {
    const { from, to } = windowAroundNow(240, 600); // широкий коридор на день
    supabase
      .from('class_session')
      .select('id, starts_at, ends_at, status, class_template:template_id(name)')
      .gte('starts_at', from.toISOString())
      .lte('starts_at', to.toISOString())
      .eq('status','SCHEDULED')
      .order('starts_at', { ascending: true })
      .then(async ({ data, error }) => {
        if (error) { console.error(error); return; }
        setSessions(data ?? []);
        // посчитаем присутствующих
        if (!data) return;
        const sessionIds = (data as any[]).map(s=>s.id);
        const { data: att } = await supabase
          .from('attendance')
          .select('session_id')
          .in('session_id', sessionIds);
        const counts: Record<string, number> = {};
        (att ?? []).forEach(a => { counts[a.session_id] = (counts[a.session_id] || 0) + 1; });
        setRoster(counts);
      });
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Сегодня • Занятия тренера</h1>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
        {(sessions ?? []).map(s => (
          <li key={s.id} style={{ border: '1px solid #ccc', padding: 12, borderRadius: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{s.class_template?.name || 'Занятие'}</div>
            <div>{fmt(s.starts_at)} — {fmt(s.ends_at)}</div>
            <div style={{ marginTop: 4 }}>Отметились: <b>{roster[s.id] ?? 0}</b></div>
          </li>
        ))}
      </ul>
    </main>
  );
}
