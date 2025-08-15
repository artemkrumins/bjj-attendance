import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { windowAroundNow, fmt } from '../../lib/date';

export default function StudentHome() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [rsvp, setRsvp] = useState<Record<string,'PLANNED'|'DECLINED'|undefined>>({});

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      const { data: prof } = await supabase.from('user_profile').select('user_id, first_name, last_name, birth_date, role').eq('user_id', uid).single();
      setMe(prof);
      // Загрузим ближайшие занятия (на неделю)
      const { from, to } = windowAroundNow(0, 60*24*7);
      const { data: sess } = await supabase
        .from('class_session')
        .select('id, starts_at, ends_at, status, class_template:template_id(name,category, min_age, max_age, visible_to_adults, visible_to_kids)')
        .gte('starts_at', from.toISOString())
        .lte('starts_at', to.toISOString())
        .eq('status','SCHEDULED')
        .order('starts_at', { ascending: true });
      setSessions(sess ?? []);
      // Подтянем мои RSVP
      const ids = (sess ?? []).map(s=>s.id);
      if (ids.length) {
        const { data: my } = await supabase.from('rsvp').select('session_id, status').eq('student_id', uid).in('session_id', ids);
        const m: Record<string,'PLANNED'|'DECLINED'> = {};
        (my ?? []).forEach(x => m[x.session_id] = x.status);
        setRsvp(m);
      }
    });
  }, []);

  async function setStatus(session_id: string, status: 'PLANNED'|'DECLINED') {
    if (!me) return;
    await supabase.from('rsvp').upsert({ session_id, student_id: me.user_id, status });
    setRsvp(prev => ({ ...prev, [session_id]: status }));
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Ближайшие занятия</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {(sessions ?? []).map(s => (
          <li key={s.id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, marginBottom: 8 }}>
            <div style={{ fontWeight: 700 }}>{s.class_template?.name}</div>
            <div>{fmt(s.starts_at)} — {fmt(s.ends_at)}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button
                onClick={()=>setStatus(s.id,'PLANNED')}
                style={{ padding: '8px 12px', background: rsvp[s.id]==='PLANNED' ? '#0a0' : '#eee' }}
              >Пойду</button>
              <button
                onClick={()=>setStatus(s.id,'DECLINED')}
                style={{ padding: '8px 12px', background: rsvp[s.id]==='DECLINED' ? '#a00' : '#eee', color: rsvp[s.id]==='DECLINED' ? '#fff' : '#000' }}
              >Не смогу</button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
