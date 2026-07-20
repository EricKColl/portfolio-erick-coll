"use client";

import { useEffect, useState } from "react";

const links = [
  { id: "proyectos", label: "Proyectos" },
  { id: "experiencia", label: "Experiencia" },
  { id: "stack", label: "Stack" },
  { id: "contacto", label: "Contacto" },
];

export default function Navigation() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      frame = 0;
      const headerHeight = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 76;
      const probe = window.scrollY + headerHeight + window.innerHeight * 0.22;
      let current: string | null = null;

      for (const { id } of links) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top + window.scrollY <= probe) {
          current = id;
        }
      }

      setActiveSection((previous) => (previous === current ? previous : current));
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <nav className="primary-nav" aria-label="Navegación principal">
      {links.map(({ id, label }) => (
        <a
          key={id}
          className={activeSection === id ? "is-active" : undefined}
          href={`#${id}`}
          aria-current={activeSection === id ? "location" : undefined}
          onClick={() => setActiveSection(id)}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
