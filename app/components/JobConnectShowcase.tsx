"use client";

/* eslint-disable @next/next/no-img-element -- Portada WebP local con dimensiones explícitas. */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { assetPath } from "../lib/asset-path";

type PortfolioProject = {
  number: string;
  title: string;
  type: string;
  description: string;
  technologies: string[];
  accent: string;
};

type ActiveVideo = {
  id: string;
  title: string;
};

type ProjectPhase = {
  number: string;
  label: string;
  title: string;
  src: string;
};

type ShowcaseConfig = {
  slug: string;
  githubUrl: string;
  liveUrl?: string;
  displayMode?: "phases" | "experience";
  coverImage?: string;
  coverAlt: string;
  phases: ProjectPhase[];
};

const showcaseConfigs: Record<string, ShowcaseConfig> = {
  JobConnect: {
    slug: "jobconnect",
    githubUrl: "https://github.com/EricKColl/FullStackAttack-Producto4.git",
    coverImage: assetPath("/jobconnect/cover.webp"),
    coverAlt: "Vista de la gestión de usuarios de JobConnect",
    phases: [
      { number: "01", label: "Producto 1", title: "Fundamentos", src: assetPath("/jobconnect/fase-1.html") },
      { number: "02", label: "Producto 2", title: "Interacción", src: assetPath("/jobconnect/fase-2.html") },
      { number: "03", label: "Producto 3", title: "Backend conectado", src: assetPath("/jobconnect/fase-3.html") },
      { number: "04", label: "Producto 4", title: "Integración full-stack", src: assetPath("/jobconnect/fase-4.html") },
    ],
  },
  ReparaYa: {
    slug: "reparaya",
    githubUrl: "https://github.com/EricKColl/ReparaYa-Producto4-WordPress",
    coverImage: assetPath("/reparaya/cover.webp"),
    coverAlt: "Página principal del servicio técnico ReparaYa",
    phases: [
      { number: "01", label: "Producto 1", title: "Fundamentos PHP", src: assetPath("/reparaya/fase-1.html") },
      { number: "02", label: "Producto 2", title: "MVC y roles", src: assetPath("/reparaya/fase-2.html") },
      { number: "03", label: "Producto 3", title: "Laravel y B2B", src: assetPath("/reparaya/fase-3.html") },
      { number: "04", label: "Producto 4", title: "WordPress conectado", src: assetPath("/reparaya/fase-4.html") },
    ],
  },
  "Online Store": {
    slug: "online-store",
    githubUrl: "https://github.com/jenhmy/bugbusters_P5.git",
    coverImage: assetPath("/online-store/cover.webp"),
    coverAlt: "Panel de control empresarial de BugBusters Store",
    phases: [
      { number: "01", label: "Producto 1", title: "Modelado del dominio", src: assetPath("/online-store/fase-1.html") },
      { number: "02", label: "Producto 2", title: "Implementación Java", src: assetPath("/online-store/fase-2.html") },
      { number: "03", label: "Producto 3", title: "JDBC y MySQL", src: assetPath("/online-store/fase-3.html") },
      { number: "04", label: "Producto 4", title: "JPA e Hibernate", src: assetPath("/online-store/fase-4.html") },
      { number: "05", label: "Producto 5", title: "JavaFX", src: assetPath("/online-store/fase-5.html") },
    ],
  },
  TrendTech: {
    slug: "trendtech",
    githubUrl: "https://github.com/ErickColl/Trendtech",
    liveUrl: "https://erickcoll.github.io/Trendtech/",
    displayMode: "experience",
    coverImage: assetPath("/trendtech/cover.webp"),
    coverAlt: "Sala tridimensional futurista de TrendTech",
    phases: [
      { number: "01", label: "Experiencia", title: "Sala inmersiva 3D", src: assetPath("/trendtech/index.html?v=27") },
    ],
  },
};

function ProjectCoverArt({ variant }: { variant: "reparaya" | "online-store" }) {
  if (variant === "reparaya") {
    return (
      <span className="project-cover-art project-cover-art-reparaya" aria-hidden="true">
        <svg viewBox="0 0 720 320" role="presentation">
          <defs>
            <linearGradient id="reparaya-metal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff0a8" />
              <stop offset="0.45" stopColor="#d4af37" />
              <stop offset="1" stopColor="#6b4e10" />
            </linearGradient>
            <radialGradient id="reparaya-core">
              <stop offset="0" stopColor="#fff7ca" stopOpacity="0.95" />
              <stop offset="0.42" stopColor="#d4af37" stopOpacity="0.42" />
              <stop offset="1" stopColor="#d4af37" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g className="cover-circuit">
            <path d="M0 82h168l54 54h76" />
            <path d="M720 72H560l-62 62h-78" />
            <path d="M0 248h176l50-50h76" />
            <path d="M720 254H548l-54-54h-74" />
            <circle cx="168" cy="82" r="5" /><circle cx="560" cy="72" r="5" />
            <circle cx="176" cy="248" r="5" /><circle cx="548" cy="254" r="5" />
          </g>
          <circle cx="360" cy="160" r="118" fill="url(#reparaya-core)" />
          <g className="cover-gear" transform="translate(360 160)">
            <circle r="78" />
            <path d="M0-104v25M0 79v25M-104 0h25M79 0h25M-74-74l18 18M56 56l18 18M74-74L56-56M-56 56l-18 18" />
          </g>
          <path className="cover-wrench" fill="url(#reparaya-metal)" d="M391 102c-15-7-34-5-47 8-12 12-15 29-10 44l-54 54a13 13 0 0 0 18 18l54-54c15 5 32 2 44-10 13-13 15-32 8-47l-24 24-18-5-5-18 24-24c3 3 7 6 10 10Z" />
        </svg>
        <span className="cover-energy-line" />
      </span>
    );
  }

  return (
    <span className="project-cover-art project-cover-art-online" aria-hidden="true">
      <svg viewBox="0 0 720 320" role="presentation">
        <defs>
          <linearGradient id="online-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#dffcff" />
            <stop offset="0.5" stopColor="#65d8ff" />
            <stop offset="1" stopColor="#5468ff" />
          </linearGradient>
          <radialGradient id="online-core">
            <stop offset="0" stopColor="#88eeff" stopOpacity="0.72" />
            <stop offset="1" stopColor="#315dff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="cover-data-lines">
          <path d="M32 70h138l58 58" /><path d="M688 70H550l-58 58" />
          <path d="M32 250h138l58-58" /><path d="M688 250H550l-58-58" />
          <circle cx="32" cy="70" r="5" /><circle cx="688" cy="70" r="5" />
          <circle cx="32" cy="250" r="5" /><circle cx="688" cy="250" r="5" />
        </g>
        <circle cx="360" cy="160" r="138" fill="url(#online-core)" />
        <g className="cover-cube" transform="translate(360 160)">
          <path d="M0-94 88-47 88 47 0 94-88 47-88-47Z" />
          <path d="m0-94 0 94 88-47M0 0l-88-47M0 0v94" />
        </g>
        <g className="cover-database" transform="translate(360 156)">
          <ellipse cx="0" cy="-36" rx="43" ry="15" />
          <path d="M-43-36v58c0 9 19 16 43 16s43-7 43-16v-58" />
          <path d="M-43-8c0 9 19 16 43 16S43 1 43-8" />
        </g>
      </svg>
      <span className="cover-energy-line" />
    </span>
  );
}

export default function ProjectShowcase({ project }: { project: PortfolioProject }) {
  const config = showcaseConfigs[project.title];
  const phases = config.phases;
  const isExperience = config.displayMode === "experience";
  const totalPhases = String(phases.length).padStart(2, "0");
  const [open, setOpen] = useState(false);
  const [activePhase, setActivePhase] = useState(0);
  const [frameReady, setFrameReady] = useState(false);
  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const launchButtonRef = useRef<HTMLButtonElement>(null);
  const phaseFrameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!open) return;

    const launchElement = launchButtonRef.current;
    document.body.classList.add("case-study-open");
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      const videoIsOpen = Boolean(document.querySelector(".jobconnect-video-layer"));

      if (event.key === "Escape") {
        if (videoIsOpen) setActiveVideo(null);
        else setOpen(false);
      }
      if (videoIsOpen) return;
      if (event.key === "ArrowRight") {
        setFrameReady(false);
        setActivePhase((current) => Math.min(current + 1, config.phases.length - 1));
      }
      if (event.key === "ArrowLeft") {
        setFrameReady(false);
        setActivePhase((current) => Math.max(current - 1, 0));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("case-study-open");
      document.removeEventListener("keydown", handleKeyDown);
      launchElement?.focus();
    };
  }, [config.phases.length, open]);

  const launch = () => {
    setFrameReady(false);
    setActiveVideo(null);
    setActivePhase(0);
    setOpen(true);
  };

  const selectPhase = (index: number) => {
    if (index === activePhase) return;
    setFrameReady(false);
    setActiveVideo(null);
    setActivePhase(index);
  };

  const showVideo = (id: string, title: string) => {
    setActiveVideo({ id, title });
  };

  const connectVideoLaunchers = () => {
    const frameDocument = phaseFrameRef.current?.contentDocument;
    if (!frameDocument) return;

    frameDocument.querySelectorAll<HTMLElement>(".yt-facade, .nx-yt").forEach((launcher) => {
      if (launcher.dataset.portfolioVideoReady === "true") return;
      launcher.dataset.portfolioVideoReady = "true";

      launcher.addEventListener(
        "click",
        (event) => {
          const id = launcher.dataset.vid;
          if (!id) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          showVideo(id, launcher.dataset.title || `Vídeo de ${project.title}`);
        },
        true,
      );
    });

    const embeddedVideos = frameDocument.querySelectorAll<HTMLIFrameElement>('iframe[src*="youtube.com/embed/"]');
    if (embeddedVideos.length > 0 && !frameDocument.getElementById("portfolio-video-bridge-style")) {
      const style = frameDocument.createElement("style");
      style.id = "portfolio-video-bridge-style";
      style.textContent = `
        .portfolio-video-wrapper { position: relative !important; }
        .portfolio-video-source {
          visibility: hidden !important;
          pointer-events: none !important;
        }
        .portfolio-video-launch {
          position: absolute; inset: 0; z-index: 30; display: grid; place-content: center;
          gap: 12px; width: 100%; border: 0;
          background-image:
            linear-gradient(rgba(0, 8, 24, .2), rgba(0, 5, 18, .78)),
            var(--portfolio-video-poster);
          background-position: center;
          background-size: cover;
          color: #fff;
          font: 700 13px "Chakra Petch", system-ui, sans-serif; letter-spacing: .12em;
          text-transform: uppercase; cursor: pointer;
          transition: filter .25s ease, transform .25s ease;
        }
        .portfolio-video-launch::before {
          content: "▶"; display: grid; place-items: center; width: 72px; height: 72px;
          margin: 0 auto; border: 1px solid rgba(86, 221, 255, .8); border-radius: 50%;
          color: #56ddff; font-size: 24px; box-shadow: 0 0 34px rgba(0, 240, 255, .35);
        }
        .portfolio-video-launch:hover { filter: brightness(1.12) saturate(1.08); }
      `;
      frameDocument.head.appendChild(style);
    }

    embeddedVideos.forEach((videoFrame) => {
      const wrapper = videoFrame.parentElement;
      const match = videoFrame.src.match(/\/embed\/([^?]+)/);
      if (!wrapper || !match || wrapper.querySelector(".portfolio-video-launch")) return;

      const videoId = match[1];
      const videoTitle = videoFrame.title || `Vídeo de ${project.title}`;
      wrapper.classList.add("portfolio-video-wrapper");
      videoFrame.classList.add("portfolio-video-source");
      videoFrame.setAttribute("aria-hidden", "true");
      videoFrame.tabIndex = -1;

      const button = frameDocument.createElement("button");
      button.type = "button";
      button.className = "portfolio-video-launch";
      button.textContent = "Reproducir vídeo";
      button.setAttribute("aria-label", `Reproducir ${videoTitle}`);
      button.style.setProperty("--portfolio-video-poster", `url("https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg")`);
      button.addEventListener("click", () => showVideo(videoId, videoTitle));
      wrapper.appendChild(button);
    });
  };

  const handlePhaseLoad = () => {
    const frameDocument = phaseFrameRef.current?.contentDocument;

    if (frameDocument && window.matchMedia("(max-width: 700px)").matches) {
      let mobileStyle = frameDocument.getElementById("portfolio-mobile-bridge") as HTMLStyleElement | null;

      if (!mobileStyle) {
        mobileStyle = frameDocument.createElement("style");
        mobileStyle.id = "portfolio-mobile-bridge";
        mobileStyle.textContent = `
          html, body {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            overflow-x: clip !important;
          }
          body { overscroll-behavior-x: none; }
          img, video, iframe { max-width: 100% !important; }
          button, a, input, select, textarea { touch-action: manipulation; }
          @media (max-width: 700px) {
            [style*="width:"] { max-width: 100% !important; }
            [style*="grid-template-columns"] { min-width: 0 !important; }
          }
        `;
        frameDocument.head.appendChild(mobileStyle);
      }
    }

    setFrameReady(true);
    connectVideoLaunchers();
  };

  const phase = phases[activePhase];

  return (
    <>
      <article className={`project-card project-${project.accent} jobconnect-card interactive-project-card`}>
        <div className="project-topline">
          <span>{project.number}</span>
          <span>{isExperience ? "EXPERIENCIA INMERSIVA · THREE.JS" : `CASO INTERACTIVO · ${phases.length} FASES`}</span>
        </div>

        <button
          className={`jobconnect-cover project-showcase-cover project-showcase-cover-${config.slug}`}
          type="button"
          onClick={launch}
          aria-label={`Abrir proyecto ${project.title}`}
        >
          {config.coverImage ? (
            <img
              src={config.coverImage}
              alt={config.coverAlt}
              width="1772"
              height="877"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <ProjectCoverArt variant={config.slug as "reparaya" | "online-store"} />
          )}
          <span className="jobconnect-cover-shade" aria-hidden="true" />
        </button>

        <div className="jobconnect-summary">
          <p className="project-type">{project.type}</p>
          <h3>{project.title}</h3>
          <p className="project-description">{project.description}</p>
          <ul className="tag-list" aria-label={`Tecnologías de ${project.title}`}>
            {project.technologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
          <div className="jobconnect-actions">
            <button ref={launchButtonRef} type="button" onClick={launch}>
              Abrir Proyecto
            </button>
            <a href={config.githubUrl} target="_blank" rel="noreferrer">
              GitHub <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </article>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className={`case-study-modal case-study-${config.slug}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`case-study-title-${config.slug}`}
            >
              <div className="case-study-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
              <section className="case-study-shell">
                <div className="case-study-grid" aria-hidden="true" />
                <header className="case-study-header">
                  <h2 id={`case-study-title-${config.slug}`}>{project.title}</h2>
                  <div className="case-study-header-actions">
                    {config.liveUrl ? (
                      <a href={config.liveUrl} target="_blank" rel="noreferrer">
                        Abrir versión web <span aria-hidden="true">↗</span>
                      </a>
                    ) : null}
                    <a href={config.githubUrl} target="_blank" rel="noreferrer">
                      <span className="github-pulse" aria-hidden="true" />
                      Ver repositorio GitHub <span aria-hidden="true">↗</span>
                    </a>
                    <button ref={closeButtonRef} type="button" onClick={() => setOpen(false)} aria-label="Cerrar caso de estudio">
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>
                </header>

                {!isExperience ? (
                  <>
                    <nav className="phase-navigation" aria-label={`Fases del proyecto ${project.title}`}>
                      <ol>
                        {phases.map((item, index) => (
                          <li key={item.number}>
                            <button
                              type="button"
                              className={`${index === activePhase ? "is-active" : ""} ${index < activePhase ? "is-complete" : ""}`}
                              onClick={() => selectPhase(index)}
                              aria-current={index === activePhase ? "step" : undefined}
                            >
                              <span className="phase-number">{item.number}</span>
                              <span>
                                <small>{item.label}</small>
                                <strong>{item.title}</strong>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ol>
                    </nav>
                    <label className="phase-mobile-select">
                      <span>Fase {phase.number} de {totalPhases}</span>
                      <select
                        value={activePhase}
                        onChange={(event) => selectPhase(Number(event.target.value))}
                        aria-label={`Seleccionar fase de ${project.title}`}
                      >
                        {phases.map((item, index) => (
                          <option value={index} key={item.number}>
                            {item.number} · {item.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : null}

                <div className={`phase-viewport ${frameReady ? "is-ready" : ""}`}>
                  <div className="phase-loader" aria-hidden="true">
                    <span />
                    <p>{isExperience ? "INICIALIZANDO ENTORNO INMERSIVO" : `MATERIALIZANDO FASE ${phase.number}`}</p>
                  </div>
                  <iframe
                    key={phase.src}
                    ref={phaseFrameRef}
                    className="phase-frame"
                    src={phase.src}
                    title={`${phase.label}: ${phase.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    onLoad={handlePhaseLoad}
                  />
                </div>

                {!isExperience ? (
                  <footer className="case-study-footer">
                    <button
                      type="button"
                      onClick={() => selectPhase(activePhase - 1)}
                      disabled={activePhase === 0}
                    >
                      <span aria-hidden="true">←</span> Fase anterior
                    </button>
                    <span>{String(activePhase + 1).padStart(2, "0")} / {totalPhases}</span>
                    {activePhase < phases.length - 1 ? (
                      <button type="button" onClick={() => selectPhase(activePhase + 1)}>
                        Siguiente fase <span aria-hidden="true">→</span>
                      </button>
                    ) : (
                      <button type="button" onClick={() => setOpen(false)}>
                        Cerrar recorrido <span aria-hidden="true">✓</span>
                      </button>
                    )}
                  </footer>
                ) : null}
              </section>

              {activeVideo ? (
                <section className="jobconnect-video-layer" aria-label={activeVideo.title}>
                  <header>
                    <div>
                      <span>REPRODUCCIÓN DIRECTA</span>
                      <h2>{activeVideo.title}</h2>
                    </div>
                    <button type="button" onClick={() => setActiveVideo(null)} aria-label="Cerrar vídeo">
                      <span aria-hidden="true">×</span>
                    </button>
                  </header>
                  <div className="jobconnect-video-stage">
                    <iframe
                      src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                      title={activeVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                </section>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
