export function yearsOld(birthDate?: string | null) {
  if (!birthDate) return undefined;
  const d = new Date(birthDate);
  const n = new Date();
  let age = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) age--;
  return age;
}
