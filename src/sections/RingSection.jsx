import Scene3D from '../components/3d/Scene3D'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useDeviceTier } from '../hooks/useDeviceTier'
import { SECTION_IDS } from '../data/site'

/**
 * The 3D ring.
 *
 * SCOPE NOTE (Step 1): the ring renders with the studio rig, a slow idle
 * rotation and the particle field at the correct device-tier density.
 *
 * Step 6 wires scroll to rotation — 180° across the first viewport, another
 * 180° across the second — plus the camera push and the "EVERY DETAIL MATTERS"
 * text reveal keyed to that motion.
 *
 * The particle count here is a third of the hero's: this section is about one
 * object, and a busy field behind it flattens the silhouette.
 */
export function RingSection() {
  const scope = useScrollReveal({ y: 38, blur: 7, stagger: 0.1 })
  const { particleCount } = useDeviceTier()

  return (
    <section
      id={SECTION_IDS.ring}
      ref={scope}
      aria-labelledby="ring-title"
      className="relative isolate overflow-hidden bg-cream py-28 md:py-40"
    >
      <div className="shell relative grid items-center gap-12 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-5">
          <p data-reveal className="eyebrow text-gold-deep">
            06 — The Ring
          </p>
          <h2
            id="ring-title"
            data-reveal
            className="display-lg mt-6 whitespace-pre-line text-ink"
          >
            {'EVERY DETAIL\nMATTERS.'}
          </h2>
          <p data-reveal className="measure mt-7 text-[0.92rem] leading-relaxed text-muted">
            A ring is the smallest piece we make and the one that is looked at
            the most. The band is finished inside and out — a detail nobody
            sees, and the one the wearer feels every day.
          </p>
          <p data-reveal className="eyebrow mt-10 text-[0.55rem] text-gold-deep">
            Scroll to turn the piece
          </p>
        </div>

        <div className="lg:col-span-7">
          <Scene3D
            className="h-[80vw] max-h-[32rem] w-full md:h-[36rem] lg:h-[42rem] lg:max-h-none"
            piece="ring"
            lightingIntensity={1.05}
            particles={Math.round(particleCount * 0.34)}
            particleRadius={4.6}
            particleHeight={3.6}
            particleOpacity={0.32}
            particleSize={0.02}
            cameraPosition={[0, 0, 5.4]}
            fov={30}
          />
        </div>
      </div>
    </section>
  )
}

export default RingSection
