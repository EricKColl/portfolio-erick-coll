# Portfolio de Erick Coll Rodríguez

Portfolio profesional de **Erick Coll Rodríguez**, Full-Stack Developer en formación. Proyectos con casos de estudio interactivos, experiencia, stack tecnológico y contacto.

🔗 **Web:** <https://erickcoll.github.io/portfolio-erick-coll/>

## Proyectos destacados

| # | Proyecto | Qué es | Enlaces |
|---|---|---|---|
| 01 | **HotelScout** | PWA en producción que localiza alojamientos reales cerca de estaciones y aeropuertos con OpenStreetMap, sin inventar precios. Proxy propio en Cloudflare, mapa, 94 pruebas automáticas | [Web](https://hotelscout.pages.dev) · [Código](https://github.com/EricKColl/hotelscout) |
| 02 | **JobConnect** | Plataforma full-stack de empleo: JWT, roles, GraphQL y tiempo real | [Código](https://github.com/EricKColl/FullStackAttack-Producto4) |
| 03 | **ReparaYa** | Gestión de incidencias: de MVC en PHP a Laravel y WordPress | [Código](https://github.com/EricKColl/ReparaYa-Producto4-WordPress) |
| 04 | **Online Store** | Aplicación de escritorio Java con JDBC, JPA/Hibernate y JavaFX | [Código](https://github.com/jenhmy/bugbusters_P5) |
| 05 | **TrendTech** | Experiencia web inmersiva 3D con Three.js | [Web](https://erickcoll.github.io/Trendtech/) · [Código](https://github.com/ErickColl/Trendtech) |

Cada proyecto se abre como un **caso de estudio por fases** dentro del propio portfolio.

## Tecnologías

- **Aplicación:** Next.js 16 (React 19, TypeScript) sobre [vinext](https://github.com/cloudflare/vinext) y Vite, Tailwind CSS 4.
- **Publicación:** exportación estática a **GitHub Pages** mediante GitHub Actions.
- **Diseño:** CSS propio, animaciones respetuosas con `prefers-reduced-motion`, diseño adaptable y enlace de salto al contenido.

## Estructura

```text
app/
  page.tsx                    Contenido: proyectos, hero, tecnologías
  layout.tsx                  Metadatos, Open Graph y tipografías
  globals.css                 Estilos
  components/
    JobConnectShowcase.tsx    Tarjeta de proyecto + visor de casos de estudio por fases
    ProjectsIntro.tsx · ExperienceSection.tsx · StackExperience.tsx · ContactSection.tsx · Navigation.tsx
public/
  <proyecto>/cover.webp       Portada (1772 × 877)
  <proyecto>/fase-N.html      Páginas del caso de estudio (se muestran en un iframe)
.github/workflows/deploy-pages.yml   Compilación y despliegue en GitHub Pages
```

## Desarrollo local

Requiere Node.js `>=22.13.0`.

```bash
npm ci              # instala dependencias con el lockfile
npm run dev         # servidor de desarrollo (Vite / vinext)
npm run lint        # ESLint
GITHUB_ACTIONS=true npm run build:pages   # exportación estática en out/ (como en producción)
```

En PowerShell: `$env:GITHUB_ACTIONS="true"; npm run build:pages`.

> `npm run build` y `npm test` usan los scripts de verificación de la plataforma Sites, pensados para Linux (`flock`, `curl`, `timeout`); no hacen falta para editar el proyecto en Windows.

## Añadir un proyecto nuevo

1. Añadir el objeto en el array `projects` de `app/page.tsx` (número, título, tipo, descripción, tecnologías, acento).
2. Añadir su configuración en `showcaseConfigs` de `app/components/JobConnectShowcase.tsx` con la **misma clave que el título**: `slug`, `githubUrl`, `coverImage`, `phases` y, opcionalmente, `liveUrl`, `featured` y `status`.
3. Colocar `cover.webp` y las páginas `fase-N.html` en `public/<slug>/` (rutas siempre con `assetPath(...)` para respetar el `basePath` de GitHub Pages).
4. Si usa un acento de color nuevo, definir `.project-<acento>` en `globals.css`.
5. Comprobar con `GITHUB_ACTIONS=true npm run build:pages`.

## Despliegue

Cada `push` a `main` ejecuta `.github/workflows/deploy-pages.yml`: `npm ci` → `npm run build:pages` → publicación de `out/` en GitHub Pages. El `basePath` (`/portfolio-erick-coll`) se aplica solo en Actions.

## Base de la plataforma

El proyecto parte de una plantilla de vinext con soporte opcional para Cloudflare D1 y Drizzle (`db/`, `drizzle/`, `.openai/hosting.json`), que este portfolio no utiliza en la versión estática.

## Contacto

Girona · España — enlaces de contacto en la sección final del portfolio.
