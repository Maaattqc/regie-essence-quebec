export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowY: "auto", height: "100dvh" }}>
      {children}
    </div>
  );
}
