"use client";

import { useEffect, useRef, type CSSProperties } from "react";

type Technology = {
  name: string;
  color: string;
  icon?: string;
  monogram?: string;
  mobileOnly?: boolean;
};

const modules: Array<{
  id: string;
  system: string;
  title: string;
  description: string;
  outcome: string;
  technologies: Technology[];
}> = [
  {
    id: "frontend",
    system: "INTERFACE LAYER",
    title: "Frontend",
    description:
      "Interfaces accesibles, responsive y precisas: estructura semántica, interacción fluida y una experiencia visual consistente en cada pantalla.",
    outcome: "Claridad visual · interacción · rendimiento",
    technologies: [
      { name: "HTML5", icon: "/stack-icons/html5.svg", color: "#E34F26" },
      { name: "CSS3", icon: "/stack-icons/css.svg", color: "#8B5CF6" },
      { name: "JavaScript", icon: "/stack-icons/javascript.svg", color: "#F7DF1E" },
      { name: "Responsive UI", monogram: "RWD", color: "#55DFFF" },
      { name: "JavaFX", icon: "/stack-icons/openjdk.svg", color: "#4A90C2" },
      { name: "TypeScript", monogram: "TS", color: "#3178C6", mobileOnly: true },
    ],
  },
  {
    id: "backend",
    system: "LOGIC ENGINE",
    title: "Backend",
    description:
      "Servicios, reglas de negocio y APIs diseñadas para crecer sin perder control, con arquitecturas mantenibles y flujos bien definidos.",
    outcome: "Arquitectura · seguridad · escalabilidad",
    technologies: [
      { name: "Laravel", icon: "/stack-icons/laravel.svg", color: "#FF2D20" },
      { name: "PHP", icon: "/stack-icons/php.svg", color: "#777BB4" },
      { name: "Node.js", icon: "/stack-icons/nodedotjs.svg", color: "#5FA04E" },
      { name: "Express", icon: "/stack-icons/express.svg", color: "#F4F7FB" },
      { name: "GraphQL", icon: "/stack-icons/graphql.svg", color: "#E10098" },
      { name: "Java", icon: "/stack-icons/openjdk.svg", color: "#ED8B00", mobileOnly: true },
    ],
  },
  {
    id: "data",
    system: "DATA MEMORY",
    title: "Datos",
    description:
      "Persistencia relacional y documental convertida en una base fiable: modelos coherentes, consultas eficientes e información preparada para decidir.",
    outcome: "Integridad · persistencia · acceso",
    technologies: [
      { name: "MySQL", icon: "/stack-icons/mysql.svg", color: "#4FA7C7" },
      { name: "MongoDB", icon: "/stack-icons/mongodb.svg", color: "#47A248" },
      { name: "JDBC", monogram: "JDBC", color: "#F28C28" },
      { name: "JPA", monogram: "JPA", color: "#F4C95D" },
      { name: "Hibernate", icon: "/stack-icons/hibernate.svg", color: "#BCAE79" },
      { name: "SQL", monogram: "SQL", color: "#5CA4D6", mobileOnly: true },
    ],
  },
  {
    id: "delivery",
    system: "DELIVERY PIPELINE",
    title: "Herramientas",
    description:
      "Versionado, pruebas, contenedores y despliegue integrados en un flujo disciplinado que reduce fricción y convierte código en producto entregable.",
    outcome: "Control · validación · entrega continua",
    technologies: [
      { name: "GitHub", icon: "/stack-icons/github.svg", color: "#F4F7FB" },
      { name: "Docker", icon: "/stack-icons/docker.svg", color: "#2496ED" },
      { name: "Postman", icon: "/stack-icons/postman.svg", color: "#FF6C37" },
      { name: "JUnit", icon: "/stack-icons/junit5.svg", color: "#25A162" },
      { name: "Railway", icon: "/stack-icons/railway.svg", color: "#F4F7FB" },
      { name: "Git", monogram: "GIT", color: "#F05032", mobileOnly: true },
    ],
  },
];

export default function StackExperience() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.14 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="stack-os" ref={sectionRef}>
      <div className="stack-os-gridfield" aria-hidden="true" />

      <header className="stack-os-heading">
        <div className="stack-os-flare" aria-hidden="true"><span /></div>
        <h2 id="stack-title">
          <span>Herramientas que dominan el código.</span>
          <span>Criterio que dirige el resultado.</span>
        </h2>
        <p>
          No acumulo tecnologías: las conecto con intención. Cada capa cumple una
          función concreta dentro de un sistema pensado para construir, validar y entregar.
        </p>
      </header>

      <div className="stack-os-system" aria-label="Ecosistema tecnológico">
        <div className="stack-os-modules">
          {modules.map((module, moduleIndex) => (
            <article
              className={`stack-os-module stack-os-module-${module.id}`}
              key={module.id}
              style={{ "--module-order": moduleIndex } as CSSProperties}
            >
              <header className="stack-os-module-header">
                <div>
                  <p>{module.system}</p>
                  <h3>{module.title}</h3>
                </div>
              </header>

              <p className="stack-os-description">{module.description}</p>

              <ul className="stack-tech-rail" aria-label={`Tecnologías de ${module.title}`}>
                {module.technologies.map((technology, techIndex) => (
                  <li
                    className={`stack-tech-chip${technology.mobileOnly ? " stack-tech-chip-mobile-only" : ""}`}
                    key={technology.name}
                    style={{
                      "--stack-brand": technology.color,
                      "--tech-order": techIndex,
                    } as CSSProperties}
                  >
                    <span className="stack-tech-surface" aria-hidden="true">
                      {technology.icon ? (
                        <span
                          className="stack-tech-vector"
                          style={{
                            maskImage: `url(${technology.icon})`,
                            WebkitMaskImage: `url(${technology.icon})`,
                          }}
                        />
                      ) : (
                        <strong className="stack-tech-monogram">{technology.monogram}</strong>
                      )}
                    </span>
                    <span className="stack-tech-label">{technology.name}</span>
                  </li>
                ))}
              </ul>

              <footer className="stack-os-output">
                <strong>{module.outcome}</strong>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
