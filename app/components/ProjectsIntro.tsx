"use client";

import { useEffect, useRef } from "react";

export default function ProjectsIntro() {
  const introRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const intro = introRef.current;
    const section = intro?.closest(".projects-section");

    if (!intro || !section) return;

    section.classList.add("is-reveal-ready");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      section.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        section.classList.add("is-visible");
        observer.disconnect();
      },
      { threshold: 0.2, rootMargin: "0px 0px -8%" },
    );

    observer.observe(intro);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="section-heading projects-heading" ref={introRef}>
      <h2 className="projects-title" id="projects-title">
        <span>Código que piensa.</span>
        <span>Soluciones que transforman.</span>
        <span>Impacto que permanece.</span>
      </h2>

      <div className="project-brief">
        <p>
          Una selección de proyectos donde arquitectura, backend, datos y
          experiencia de usuario convergen para transformar ideas en soluciones
          digitales completas.
        </p>
        <div className="project-brief-route" aria-hidden="true">
          <span>Arquitectura</span>
          <i />
          <span>Backend</span>
          <i />
          <span>Datos</span>
          <i />
          <span>Interfaz</span>
        </div>
      </div>
    </div>
  );
}
