import { animate } from "framer-motion";

export function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    const offset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = window.scrollY + elementPosition - offset;

    animate(window.scrollY, offsetPosition, {
      type: "spring",
      stiffness: 70,
      damping: 20,
      onUpdate: (value) => window.scrollTo(0, value)
    });
  }
} 