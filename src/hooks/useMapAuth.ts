import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/auth";

export function useMapAuth() {
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const sb = createBrowserClient();
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setCurrentUser({ email: session.user.email });
    });
    let lastEmail: string | null = null;
    let lastToken: string | null = null;
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      const email = session?.user?.email ?? null;
      const token = session?.access_token ?? null;
      setCurrentUser(email ? { email } : null);
      if (event === "SIGNED_IN" && email && token) {
        lastEmail = email;
        lastToken = token;
        fetch("/api/auth/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, event, token }),
        }).catch(() => {});
      }
      if (event === "SIGNED_OUT" && lastEmail && lastToken) {
        fetch("/api/auth/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: lastEmail, event, token: lastToken }),
        }).catch(() => {});
        lastEmail = null;
        lastToken = null;
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return { currentUser, setCurrentUser };
}
