"use client";

export default function HeaderContactButton() {
  const openConversation = () => {
    document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("portfolio:reveal-phone"));
    }, 520);
  };

  return (
    <button className="header-cta" type="button" onClick={openConversation}>
      Hablemos <span aria-hidden="true">↗</span>
    </button>
  );
}
