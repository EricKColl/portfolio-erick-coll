/* eslint-disable @next/next/no-img-element -- Asset estático WebP de 72 KB con dimensiones explícitas. */
import Navigation from "./components/Navigation";
import ProjectShowcase from "./components/JobConnectShowcase";
import ProjectsIntro from "./components/ProjectsIntro";
import ExperienceSection from "./components/ExperienceSection";
import StackExperience from "./components/StackExperience";
import ContactSection from "./components/ContactSection";
import HeaderContactButton from "./components/HeaderContactButton";

// Contenido centralizado: sustituye estos objetos por los datos definitivos.
const projects = [
  {
    number: "01",
    title: "JobConnect",
    type: "Plataforma full-stack de empleo",
    description:
      "Aplicación web con autenticación JWT, roles diferenciados, API GraphQL y comunicación en tiempo real.",
    technologies: ["Node.js", "GraphQL", "MongoDB", "Socket.io"],
    accent: "blue",
  },
  {
    number: "02",
    title: "ReparaYa",
    type: "Gestión integral de incidencias",
    description:
      "Evolución desde MVC en PHP hasta Laravel y WordPress, con calendario, permisos y flujos por perfil.",
    technologies: ["Laravel", "PHP", "MySQL", "WordPress"],
    accent: "silver",
  },
  {
    number: "03",
    title: "Online Store",
    type: "Aplicación de escritorio Java",
    description:
      "Gestión de clientes, artículos y pedidos mediante JDBC, persistencia ORM y una interfaz JavaFX cuidada.",
    technologies: ["Java", "JPA", "Hibernate", "JavaFX"],
    accent: "ice",
  },
  {
    number: "04",
    title: "TrendTech",
    type: "Experiencia web inmersiva 3D",
    description:
      "Portal tecnológico tridimensional con navegación espacial, postprocesado, partículas, carrusel multimedia y vídeo integrado.",
    technologies: ["Three.js", "WebGL", "JavaScript", "CSS3D"],
    accent: "neon",
  },
];

const heroTechnologies = [
  { name: "Python", image: "/tech-icons/python.svg", color: "#5AA9E6" },
  { name: "C", image: "/tech-icons/c.svg", color: "#A8B9CC" },
  { name: "C++", image: "/tech-icons/cplusplus.svg", color: "#659AD2" },
  { name: "Java", image: "/java-logo.png", color: "#E76F00" },
  { name: "JavaScript", image: "/tech-icons/javascript.svg", color: "#F7DF1E" },
  { name: "HTML5", image: "/tech-icons/html5.svg", color: "#E34F26" },
  { name: "CSS", image: "/tech-icons/css.svg", color: "#663399" },
  { name: "PHP", image: "/tech-icons/php.svg", color: "#777BB4" },
  { name: "SQL", image: "/tech-icons/mysql.svg", color: "#55A7C8" },
];

export default function Home() {
  return (
    <main>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Erick Coll Rodríguez, inicio">
          <span className="brand-name">Erick Coll Rodríguez</span>
        </a>
        <Navigation />
        <HeaderContactButton />
      </header>

      <section className="hero" id="inicio" aria-labelledby="hero-title">
        <div className="hero-flow" aria-hidden="true">
          <span className="flow-orbit flow-orbit-a" />
          <span className="flow-orbit flow-orbit-b" />
          <span className="flow-beam" />
          <span className="flow-pulse" />
        </div>
        <div className="hero-copy" id="contenido">
          <div className="hero-message">
            <h1 id="hero-title">
              <span className="hero-thesis">No compito por encajar en el mercado.</span>
              <span className="hero-vision">
                Construyo experiencias digitales que obligan al mercado a evolucionar.
              </span>
            </h1>
            <p className="hero-intro">
              Full-Stack Developer en formación. Código sólido, visión completa y
              una obsesión: superar el estándar en cada proyecto.
            </p>
          </div>
          <dl className="hero-meta" aria-label="Enfoque profesional">
            <div><dt>Enfoque</dt><dd>Full-Stack</dd></div>
            <div><dt>Método</dt><dd>Build · Test · Evolve</dd></div>
            <div><dt>Estado</dt><dd><span aria-hidden="true" />En formación</dd></div>
          </dl>
        </div>

        <div className="hero-visual">
          <div className="portrait-system">
            <div className="visual-halo" aria-hidden="true" />
            <div className="orbit orbit-one" aria-hidden="true" />
            <div className="orbit orbit-two" aria-hidden="true" />
            <div className="portrait-frame">
              <img
                src="/erick-coll-rodriguez.webp"
                alt="Retrato profesional de Erick Coll Rodríguez"
                width="532"
                height="756"
                fetchPriority="high"
                decoding="async"
              />
              <div className="portrait-scan" aria-hidden="true" />
            </div>
            <div className="portrait-signature" aria-hidden="true">
              <strong>FULL STACK</strong>
              <strong>DEVELOPER</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="tech-constellation" aria-label="Tecnologías de programación">
        <div className="tech-constellation-glow" aria-hidden="true" />
        <ul className="tech-track">
          {heroTechnologies.map((technology, index) => (
            <li
              className="tech-node"
              key={technology.name}
              style={{ color: technology.color, animationDelay: `${index * -0.65}s` }}
            >
              <span className="tech-icon" aria-hidden="true">
                {technology.name === "Java" ? (
                  <img className="java-logo" src={technology.image} alt="" width="98" height="181" />
                ) : (
                  <span
                    className="tech-glyph"
                    style={{
                      maskImage: `url(${technology.image})`,
                      WebkitMaskImage: `url(${technology.image})`,
                    }}
                  />
                )}
              </span>
              <span className="tech-name">{technology.name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="projects-section section-shell" id="proyectos" aria-labelledby="projects-title">
        <ProjectsIntro />

        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectShowcase project={project} key={project.title} />
          ))}
        </div>
      </section>

      <ExperienceSection />

      <section className="stack-section" id="stack" aria-labelledby="stack-title">
        <div className="section-shell">
          <StackExperience />

          <ContactSection />

          <footer className="site-footer">
            <p className="site-footer-location">Girona · España</p>
            <p className="site-footer-copyright">© 2026 · Todos los derechos reservados</p>
            <a className="site-footer-top" href="#inicio">
              Volver arriba <span aria-hidden="true">↑</span>
            </a>
          </footer>
        </div>
      </section>
    </main>
  );
}
