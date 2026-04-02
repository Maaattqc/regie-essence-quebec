export default function TechLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="tech-scroll-container" style={{ overflowY: "auto", height: "100dvh" }}>
      {children}
    </div>
  );
}
