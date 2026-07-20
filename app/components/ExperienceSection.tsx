"use client";

/* eslint-disable @next/next/no-img-element -- Activos vectoriales de marca y WebP local ya optimizado. */

import { useEffect, useRef } from "react";
import { assetPath } from "../lib/asset-path";

const aiTools = [
  { name: "Claude Code", logo: assetPath("/ai-logos/claude-code.svg") },
  { name: "ChatGPT", logo: assetPath("/ai-logos/chatgpt.svg"), monochrome: true },
  { name: "Gemini", logo: assetPath("/ai-logos/gemini.svg") },
  { name: "Codex", logo: assetPath("/ai-logos/codex.svg") },
  { name: "Antigravity", logo: assetPath("/ai-logos/antigravity.svg") },
  { name: "Suno.ai", logo: assetPath("/ai-logos/suno.svg"), monochrome: true },
  { name: "MiniMax", logo: assetPath("/ai-logos/minimax.svg") },
  {
    name: "HeyGen",
    logo: "https://cdn.sanity.io/images/pdhqcmb1/production/83db2519472125eff4a047b07de4d49eb4d5f880-132x132.svg",
  },
];

const administrativeStrengths = [
  { area: "Gestión administrativa", value: "Documentación y control" },
  { area: "Organización operativa", value: "Procesos y prioridades" },
  { area: "Atención al cliente", value: "Escucha y comunicación" },
  { area: "Coordinación", value: "Equipos y seguimiento" },
  { area: "Resolución", value: "Criterio bajo presión" },
];

export default function ExperienceSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

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
      { threshold: 0.12, rootMargin: "0px 0px -12%" },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="profile-section section-shell"
      id="experiencia"
      aria-labelledby="profile-title"
      ref={sectionRef}
    >
      <div className="experience-atmosphere" aria-hidden="true">
        <span className="experience-orbit experience-orbit-a" />
        <span className="experience-orbit experience-orbit-b" />
        <span className="experience-signal" />
      </div>

      <header className="experience-heading" id="perfil">
        <h2 id="profile-title">
          <span>Conocimiento que impulsa.</span>
          <span>Experiencia que transforma.</span>
        </h2>

        <div className="thought-cloud">
          <span className="thought-cloud-dot thought-cloud-dot-a" aria-hidden="true" />
          <span className="thought-cloud-dot thought-cloud-dot-b" aria-hidden="true" />
          <span className="thought-cloud-core" aria-hidden="true" />
          <p>
            Combino formación en desarrollo web con experiencia previa en
            administración, operaciones y atención al cliente. Esa mezcla me
            ayuda a entender tanto el código como el problema de negocio.
          </p>
        </div>
      </header>

      <dl className="experience-coordinates" aria-label="Resumen profesional">
        <div>
          <dt>Formación actual</dt>
          <dd>DAW · UOC</dd>
        </div>
        <div>
          <dt>Orientación técnica</dt>
          <dd>Full-stack</dd>
        </div>
        <div>
          <dt>Experiencia con IA</dt>
          <dd>2 años</dd>
        </div>
        <div>
          <dt>Ubicación</dt>
          <dd>Girona</dd>
        </div>
      </dl>

      <div className="experience-journey" aria-label="Formación y trayectoria profesional">
        <article className="experience-card experience-card-education">
          <div className="experience-card-glow" aria-hidden="true" />
          <header>
            <p>Formación técnica</p>
            <span>En evolución continua</span>
          </header>
          <h3>Desarrollo de Aplicaciones Web</h3>
          <p className="experience-source">UOC · Formación online</p>
          <p className="experience-description">
            Programación, bases de datos, sistemas y desarrollo frontend y
            backend mediante proyectos colaborativos orientados a producto.
          </p>

          <div className="education-product-desk">
            <div className="education-institution">
              <img
                src={assetPath("/uoc-logo-user.png")}
                alt="Universitat Oberta de Catalunya"
                width="372"
                height="216"
                loading="lazy"
                decoding="async"
              />
              <p>
                <span>Formación oficial</span>
                <strong>DAW · Del código al producto digital</strong>
              </p>
            </div>

            <div
              className="education-blueprint"
              aria-label="Proceso formativo DAW desde el análisis hasta la entrega"
            >
              <div className="education-blueprint-bar" aria-hidden="true">
                <span />
                <span />
                <span />
                <b>product-lab / daw</b>
                <i>live</i>
              </div>

              <div className="education-blueprint-scene" aria-hidden="true">
                <div className="blueprint-slab blueprint-slab-back">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="blueprint-slab blueprint-slab-middle">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className="blueprint-slab blueprint-slab-front">
                  <strong>DAW</strong>
                  <span>Idea · Sistema · Experiencia</span>
                </div>
                <div className="blueprint-cutline" />
              </div>

              <ol className="education-product-route">
                <li><b>01</b><span>Analizar</span></li>
                <li><b>02</b><span>Modelar</span></li>
                <li><b>03</b><span>Construir</span></li>
                <li><b>04</b><span>Validar</span></li>
              </ol>
            </div>
          </div>
        </article>

        <article className="experience-card experience-card-ai">
          <div className="experience-card-glow" aria-hidden="true" />
          <header>
            <p>Inteligencia aplicada</p>
            <span>2 años de exploración</span>
          </header>
          <h3>IA, agentes y creación multimodal</h3>
          <p className="experience-description">
            Integro modelos generativos, agentes de desarrollo y herramientas
            creativas en flujos reales: análisis, programación, automatización,
            contenido audiovisual y prototipado acelerado.
          </p>
          <div className="ai-tool-orbit" aria-label="Herramientas de inteligencia artificial">
            <figure className="ai-core" aria-hidden="true">
              <img
                src={assetPath("/experience/ai-core.webp")}
                alt=""
                width="700"
                height="700"
                loading="lazy"
                decoding="async"
              />
              <span />
            </figure>
            <ul>
              {aiTools.map((tool) => (
                <li key={tool.name}>
                  <span className="ai-logo-shell" aria-hidden="true">
                    <img
                      className={tool.monochrome ? "is-monochrome" : undefined}
                      src={tool.logo}
                      alt=""
                      width="48"
                      height="48"
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <strong>{tool.name}</strong>
                </li>
              ))}
            </ul>
          </div>
          <p className="ai-method">
            <span>Prompting estratégico</span>
            <span>Orquestación de agentes</span>
            <span>Flujos multimodales</span>
          </p>
        </article>

        <article className="experience-card experience-card-career">
          <div className="experience-card-glow" aria-hidden="true" />
          <header>
            <p>Trayectoria profesional</p>
            <span>Aptitudes</span>
          </header>
          <h3>Gestión, operaciones y atención al cliente</h3>
          <p className="experience-description">
            Más de siete años de experiencia en entornos administrativos y
            operativos han fortalecido mi capacidad para ordenar procesos,
            anticipar necesidades y convertir incidencias en soluciones claras.
          </p>
          <ul className="career-path" aria-label="Aptitudes profesionales">
            {administrativeStrengths.map((strength) => (
              <li key={strength.area}>
                <span>{strength.area}</span>
                <i aria-hidden="true" />
                <strong>{strength.value}</strong>
              </li>
            ))}
          </ul>
          <div className="experience-card-note">
            <span>Valor diferencial</span>
            <strong>Tecnología con visión de negocio</strong>
          </div>
        </article>
      </div>
    </section>
  );
}
