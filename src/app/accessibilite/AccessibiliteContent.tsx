"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const navLinks = ["/", "/confidentialite", "/conditions-utilisation", "/faq"];

// Bold labels are separated from body text by " — " in each item string.
// We split on the first " — " to render the label in <strong>.
function ListItemWithBold({ text }: { text: string }) {
  const sep = " — ";
  const idx = text.indexOf(sep);
  if (idx === -1) return <span>{text}</span>;
  const label = text.slice(0, idx);
  const body = text.slice(idx + sep.length);
  return (
    <span>
      <strong>{label}</strong>
      {sep}
      {body}
    </span>
  );
}

export default function AccessibiliteContent() {
  const { t } = useLanguage();
  const c = t.accessibility;

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <nav className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:underline">
          {c.breadcrumb}
        </Link>
        {" › "}
        <span>{c.title}</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
        {c.title}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">
        {c.lastUpdated}
      </p>

      <div className="space-y-10 text-gray-600 dark:text-gray-400">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {c.s1Title}
          </h2>
          <p>{c.s1Body}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {c.s2Title}
          </h2>
          <p>{c.s2Body}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {c.s3Title}
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            {c.s3Items.map((item) => (
              <li key={item}>
                <ListItemWithBold text={item} />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {c.s4Title}
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            {c.s4Items.map((item) => (
              <li key={item}>
                <ListItemWithBold text={item} />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {c.s5Title}
          </h2>
          <p>{c.s5Intro}</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            {c.s5Items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {c.s6Title}
          </h2>
          <p>{c.s6Intro}</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            {c.s6Items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {c.s7Title}
          </h2>
          <p>{c.s7Body}</p>
          <p className="mt-2">
            {c.s7ContactLabel}{" "}
            <a
              href="mailto:mathieufournierqc@outlook.com"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              mathieufournierqc@outlook.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {c.s8Title}
          </h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <a
                href="https://www.tresor.gouv.qc.ca/ressources-informationnelles/architecture-dentreprise-gouvernementale/standards-et-normes/accessibilite-du-web/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                SGQRI 008 3.0 — Gouvernement du Québec
              </a>
            </li>
            <li>
              <a
                href="https://www.w3.org/TR/WCAG21/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                WCAG 2.1 — W3C
              </a>
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
        {c.nav.map((label, i) => (
          <Link
            key={navLinks[i]}
            href={navLinks[i]}
            className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
          >
            {label}
          </Link>
        ))}
      </div>
    </main>
  );
}
