export default function AProposLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      {children}
    </div>
  );
}
