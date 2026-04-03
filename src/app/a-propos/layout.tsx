export default function AProposLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowY: "auto", height: "100dvh" }}>
      {children}
    </div>
  );
}
