export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#2563eb" />
      <circle cx="13" cy="13" r="3" fill="white" />
      <circle cx="27" cy="13" r="3" fill="white" />
      <circle cx="20" cy="27" r="3" fill="white" />
      <line x1="13" y1="13" x2="27" y2="13" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="13" y1="13" x2="20" y2="27" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="27" y1="13" x2="20" y2="27" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="13" cy="13" r="1.2" fill="#2563eb" />
      <circle cx="27" cy="13" r="1.2" fill="#2563eb" />
      <circle cx="20" cy="27" r="1.2" fill="#2563eb" />
    </svg>
  );
}
