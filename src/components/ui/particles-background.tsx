import { useCallback } from "react";
import { Container, Engine } from "@tsparticles/engine";
import { loadFull } from "tsparticles";
import Particles from "@tsparticles/react";

/**
 * Componente que renderiza un fondo interactivo con partículas
 * @returns JSX.Element con el fondo de partículas
 */
export const ParticlesBackground = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    // Opcional: Puedes realizar acciones cuando las partículas se hayan cargado
  }, []);

  return (
    <div className="absolute inset-0 -z-10">
      <Particles
        id="tsparticles"
        particlesLoaded={particlesLoaded}
        options={{
          background: {
            color: {
              value: "transparent",
            },
          },
          particles: {
            color: {
              value: "#6366f1"
            },
            links: {
              color: "#6366f1",
              distance: 150,
              enable: true,
              opacity: 0.2,
              width: 1
            },
            move: {
              enable: true,
              speed: 1
            },
            number: {
              value: 80
            },
            opacity: {
              value: 0.2
            },
            size: {
              value: { min: 1, max: 3 }
            }
          }
        }}
      />
    </div>
  );
}; 