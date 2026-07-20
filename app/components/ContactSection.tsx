"use client";

import { useEffect, useRef, useState } from "react";

const email = "erickcollrodriguez@gmail.com";
const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent("Contacto desde tu portfolio")}`;
const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent("Contacto desde tu portfolio")}`;

function GmailIcon() {
  return (
    <svg viewBox="0 0 100 82" aria-hidden="true">
      <defs>
        <linearGradient id="gmail-left-vertical" x1="18" y1="13" x2="18" y2="69" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff5a8b" />
          <stop offset="0.38" stopColor="#ff3f4a" />
          <stop offset="1" stopColor="#ff3b36" />
        </linearGradient>
        <linearGradient id="gmail-left-fold" x1="18" y1="19" x2="50" y2="49" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff5a8b" />
          <stop offset="0.48" stopColor="#ff4055" />
          <stop offset="1" stopColor="#ff343d" />
        </linearGradient>
        <linearGradient id="gmail-right-fold" x1="50" y1="49" x2="82" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff343d" />
          <stop offset="0.55" stopColor="#ff5b31" />
          <stop offset="1" stopColor="#ffc400" />
        </linearGradient>
        <linearGradient id="gmail-right-vertical" x1="82" y1="19" x2="82" y2="69" gradientUnits="userSpaceOnUse">
          <stop stopColor="#12c86b" />
          <stop offset="0.48" stopColor="#09a79c" />
          <stop offset="1" stopColor="#3979f6" />
        </linearGradient>
      </defs>
      <path d="M18 69V19" stroke="url(#gmail-left-vertical)" strokeWidth="17" strokeLinecap="round" />
      <path d="M18 19 50 49" stroke="url(#gmail-left-fold)" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m50 49 32-30" stroke="url(#gmail-right-fold)" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M82 19v50" stroke="url(#gmail-right-vertical)" strokeWidth="17" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 6.5h17v11h-17z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.1 3.8 9.4 7a1.8 1.8 0 0 1-.2 2.3l-1.4 1.3a14.2 14.2 0 0 0 5.6 5.6l1.3-1.4a1.8 1.8 0 0 1 2.3-.2l3.2 2.3a1.8 1.8 0 0 1 .6 2.1l-.5 1.3a2.4 2.4 0 0 1-2.4 1.5C9.4 21.1 2.9 14.6 2.2 6.1A2.4 2.4 0 0 1 3.7 3.7L5 3.2a1.8 1.8 0 0 1 2.1.6Z" />
    </svg>
  );
}

export default function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [emailOptionsOpen, setEmailOptionsOpen] = useState(false);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reveal = () => {
      setPhoneVisible(true);
      window.setTimeout(() => {
        document.getElementById("phone-signal")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 520);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.22 },
    );

    observer.observe(section);
    window.addEventListener("portfolio:reveal-phone", reveal);

    return () => {
      observer.disconnect();
      window.removeEventListener("portfolio:reveal-phone", reveal);
    };
  }, []);

  const copyEmail = async () => {
    let success = false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(email);
        success = true;
      } catch {
        success = false;
      }
    }

    if (!success) {
      const temporaryField = document.createElement("textarea");
      temporaryField.value = email;
      temporaryField.setAttribute("readonly", "");
      temporaryField.style.position = "fixed";
      temporaryField.style.opacity = "0";
      temporaryField.style.pointerEvents = "none";
      document.body.appendChild(temporaryField);
      temporaryField.select();
      success = document.execCommand("copy");
      temporaryField.remove();
    }

    if (success) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <section className="contact-stage" id="contacto" aria-labelledby="contact-title" ref={sectionRef}>
      <div className="contact-lightfield" aria-hidden="true">
        <i /><i /><i />
      </div>

      <header className="contact-stage-heading">
        <h2 id="contact-title">
          <span>¿Construimos algo</span>
          <span>que merezca ser recordado?</span>
        </h2>
        <p>
          Una conversación puede ser el primer paso de un producto extraordinario.
          Elige el canal y empecemos.
        </p>
      </header>

      <div className="contact-route" aria-label="Opciones de contacto">
        <a
          className="contact-route-action"
          href="https://github.com/EricKColl"
          target="_blank"
          rel="noreferrer"
        >
          <span className="contact-route-symbol" aria-hidden="true">↗</span>
          <small>CÓDIGO Y PROYECTOS</small>
          <strong>Ver GitHub</strong>
        </a>

        <button
          className="contact-route-action"
          type="button"
          aria-expanded={emailOptionsOpen}
          aria-controls="email-options"
          onClick={() => {
            setEmailOptionsOpen((open) => {
              const nextState = !open;
              if (nextState) setPhoneVisible(false);
              return nextState;
            });
          }}
        >
          <span className="contact-route-symbol" aria-hidden="true">@</span>
          <small>MENSAJE DIRECTO</small>
          <strong>Escríbame</strong>
        </button>

        <button
          className="contact-route-action"
          type="button"
          aria-expanded={phoneVisible}
          aria-controls="phone-signal"
          onClick={() => {
            const nextState = !phoneVisible;
            setPhoneVisible(nextState);
            if (nextState) {
              setEmailOptionsOpen(false);
              window.setTimeout(() => {
                document.getElementById("phone-signal")?.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 520);
            }
          }}
        >
          <span className="contact-route-symbol" aria-hidden="true"><PhoneIcon /></span>
          <small>CONVERSACIÓN</small>
          <strong>Teléfono</strong>
        </button>
      </div>

      <div
        className={`contact-email-options${emailOptionsOpen ? " is-open" : ""}`}
        id="email-options"
        aria-hidden={!emailOptionsOpen}
      >
        <div>
          <a href={gmailUrl} target="_blank" rel="noreferrer" tabIndex={emailOptionsOpen ? 0 : -1}>
            <span className="contact-email-option-icon is-gmail"><GmailIcon /></span>
            Abrir Gmail
          </a>
          <a href={mailtoUrl} tabIndex={emailOptionsOpen ? 0 : -1}>
            <span className="contact-email-option-icon"><MailIcon /></span>
            Usar mi aplicación de correo
          </a>
          <button type="button" onClick={copyEmail} tabIndex={emailOptionsOpen ? 0 : -1}>
            <span className="contact-email-option-icon"><CopyIcon /></span>
            {copied ? "Dirección copiada" : "Copiar correo"}
          </button>
        </div>
      </div>

      <div
        className={`contact-phone-signal${phoneVisible ? " is-visible" : ""}`}
        id="phone-signal"
        aria-hidden={!phoneVisible}
      >
        <a href="tel:+34621033302" aria-label="Llamar al 621 033 302" tabIndex={phoneVisible ? 0 : -1}>
          <span>621</span><i>·</i><span>033</span><i>·</i><span>302</span>
        </a>
        <p>Pulsa el número para iniciar una llamada.</p>
      </div>
    </section>
  );
}
