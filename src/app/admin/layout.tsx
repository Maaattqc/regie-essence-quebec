export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowY: "auto", height: "100dvh" }}>
      {children}
    </div>
  );
}
