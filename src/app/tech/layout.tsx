export default function TechLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="tech-scroll-container" style={{ position: "fixed", inset: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      {children}
    </div>
  );
}
