"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export interface InteractiveNebulaShaderProps {
  className?: string;
  disableCenterDimming?: boolean;
}

/**
 * Full-screen ray-marched nebula shader with Zentry branding colors.
 */
export function InteractiveNebulaShader({
  className = "",
  disableCenterDimming = true,
}: InteractiveNebulaShaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clock = new THREE.Clock();

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    // Optimized: reduced ray-march from 6 to 4 iterations
    const fragmentShader = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;
      uniform bool disableCenterDimming;
      varying vec2 vUv;

      #define t iTime
      mat2 m(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

      float map(vec3 p){
        vec2 mouse = (iMouse.xy / iResolution.xy) - 0.5;
        p.xz *= m(t*0.2 + mouse.x * 2.0);
        p.xy *= m(t*0.1 + mouse.y * 2.0);
        vec3 q = p*2. + t*0.5;
        return length(p + vec3(sin(t*0.5))) * log(length(p)+1.0)
             + sin(q.x + sin(q.z + sin(q.y))) * 0.5 - 1.0;
      }

      void mainImage(out vec4 O, in vec2 fragCoord) {
        vec2 uv = (fragCoord - iResolution.xy * vec2(0.75, 0.5)) / min(iResolution.x, iResolution.y);
        vec3 col = vec3(0.0);
        float d = 2.5;

        vec3 zBackground = vec3(0.0, 0.2, 0.6);
        vec3 zHigh1 = vec3(0.0, 0.44, 1.0);
        vec3 zHigh2 = vec3(0.2, 0.8, 1.0);

        for (int i = 0; i <= 4; i++) {
          vec3 p = vec3(0,0,5.) + normalize(vec3(uv, -1.)) * d;
          float rz = map(p);
          float f  = clamp((rz - map(p + 0.1)) * 0.5, -0.1, 1.0);
          vec3 base = mix(zBackground, zHigh1, f) + zHigh2 * pow(f, 3.0);
          col = col * 0.8 + base * smoothstep(2.5, 0.0, rz) * 1.2;
          d += min(rz, 1.0);
        }

        float dist   = distance(fragCoord, iResolution*0.5);
        float radius = min(iResolution.x, iResolution.y) * 0.8;
        float dim    = disableCenterDimming
                     ? 1.0
                     : smoothstep(radius*0.2, radius*0.5, dist);

        O = vec4(col, 1.0);
        if (!disableCenterDimming) {
          O.rgb = mix(O.rgb * 0.2, O.rgb, dim);
        }
      }

      void main() {
        mainImage(gl_FragColor, vUv * iResolution);
      }
    `;

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2() },
      iMouse: { value: new THREE.Vector2() },
      disableCenterDimming: { value: disableCenterDimming },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    // Resize with debounce
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h);
        uniforms.iResolution.value.set(w, h);
      }, 100);
    };

    // Throttled mouse handler via RAF
    let mouseRAF: number | null = null;
    const onMouseMove = (e: MouseEvent) => {
      if (mouseRAF) return;
      mouseRAF = requestAnimationFrame(() => {
        uniforms.iMouse.value.set(e.clientX, window.innerHeight - e.clientY);
        mouseRAF = null;
      });
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // Initial size (no debounce)
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    uniforms.iResolution.value.set(w, h);

    const animate = () => {
      uniforms.iTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };
    renderer.setAnimationLoop(animate);

    return () => {
      clearTimeout(resizeTimer);
      if (mouseRAF) cancelAnimationFrame(mouseRAF);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      renderer.setAnimationLoop(null);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
    };
  }, [disableCenterDimming]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0, backgroundColor: "#003580" }}
      aria-hidden="true"
    />
  );
}
