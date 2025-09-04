import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

/**
 * Componente que muestra un número con animación de contador
 * @param props AnimatedCounterProps con las propiedades del contador
 * @returns JSX.Element con el contador animado
 */
export const AnimatedCounter = ({
  end,
  duration = 2.5,
  prefix = "",
  suffix = "",
  decimals = 0
}: AnimatedCounterProps) => {
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true
  });

  return (
    <span ref={ref} className="font-bold">
      {inView ? (
        <CountUp
          start={0}
          end={end}
          duration={duration}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
        />
      ) : (
        <span>{prefix}0{suffix}</span>
      )}
    </span>
  );
}; 