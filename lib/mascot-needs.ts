// The database stores needs as integers; live decay produces fractional values.
// Normalize all three together whenever last_updated_at is advanced.
export function persistedMascotNeeds(needs: { fame: number; sete: number; svago: number }) {
  const normalize = (value: number) => Math.round(Math.min(100, Math.max(0, value)));
  return {
    fame: normalize(needs.fame),
    sete: normalize(needs.sete),
    svago: normalize(needs.svago),
  };
}
