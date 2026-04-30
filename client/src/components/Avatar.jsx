export default function Avatar({ name = '', size = 26 }) {
  const i = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const colors = ['#e8590c','#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2','#4f46e5'];
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return (
    <span className="inline-flex items-center justify-center rounded-full text-white font-medium flex-shrink-0"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38), backgroundColor: colors[idx] }}
      title={name}>{i}</span>
  );
}
