import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { useDeviceTier } from '../../hooks/useDeviceTier'

/**
 * The single <Canvas> wrapper used by every 3D moment on the site.
 *
 * Three things here are non-obvious and worth keeping:
 *
 * 1. `frameloop` is switched to 'never' when the canvas leaves the viewport.
 *    With several 3D sections on one page, an always-on render loop burns a
 *    laptop battery and drops frames in the *other* sections. An
 *    IntersectionObserver flips it back to 'always' on approach.
 *
 * 2. `resize.scroll = false`. R3F re-measures the canvas on scroll by default,
 *    which fights GSAP-pinned sections and causes a visible one-frame jump.
 *
 * 3. WebGL availability is checked before mounting. A visitor on a locked-down
 *    browser gets a composed ivory fallback, not a black rectangle and a
 *    console full of context-creation errors.
 */

function detectWebGL() {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl')),
    )
  } catch {
    return false
  }
}

export function JewelleryScene({
  children,
  className = '',
  fill = false,
  cameraPosition = [0, 0, 6],
  fov = 34,
  fallback = null,
  observeRootMargin = '240px',
  ...canvasProps
}) {
  // `fill` switches the wrapper to absolute positioning so Scene3D can own the
  // sizing. Passing both `relative` and `absolute` in one class string would
  // make the outcome depend on stylesheet order, which is not something to bet
  // a layout on.
  const positionClass = fill ? 'absolute inset-0' : 'relative'
  const hostRef = useRef(null)
  const [visible, setVisible] = useState(true)
  const [webgl] = useState(detectWebGL)
  const { dpr, tier } = useDeviceTier()

  useEffect(() => {
    const element = hostRef.current
    if (!element || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: observeRootMargin },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [observeRootMargin])

  if (!webgl) {
    return (
      <div ref={hostRef} className={`${positionClass} ${className}`}>
        {fallback ?? (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,#EFE3C6_0%,transparent_62%)]"
          />
        )}
      </div>
    )
  }

  return (
    <div ref={hostRef} className={`${positionClass} ${className}`}>
      <Canvas
        dpr={dpr}
        frameloop={visible ? 'always' : 'never'}
        camera={{ position: cameraPosition, fov, near: 0.1, far: 120 }}
        gl={{
          antialias: tier === 'high',
          alpha: true,
          stencil: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
        }}
        resize={{ scroll: false, debounce: { scroll: 40, resize: 0 } }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.02
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.setClearAlpha(0)
        }}
        style={{ width: '100%', height: '100%', touchAction: 'pan-y' }}
        {...canvasProps}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  )
}

export default JewelleryScene
