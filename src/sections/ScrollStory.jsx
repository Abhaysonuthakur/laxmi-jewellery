import { useRef } from 'react'
import Scene3D from '../components/3d/Scene3D'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useStoryScroll } from '../hooks/useStoryScroll'
import { SECTION_IDS } from '../data/site'

/**
 * The 3D scroll story — the section that carries the whole site.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS IS
 * ---------------------------------------------------------------------------
 * A three-viewport section whose inner stage is `sticky top-0 h-[100dvh]`. The
 * visitor scrolls two viewport heights while the composition stays put and its
 * *contents* change: a title card leaves, a necklace arrives and turns while
 * the camera pushes in, the light drops for an inspection, the necklace hands
 * over to a bangle, and the whole frame washes to ivory so it dissolves into
 * the brand statement that follows.
 *
 * The copy changes sides with the subject rather than sitting in a fixed
 * column. That is what makes the section read as a sequence of shots instead of
 * a paragraph with a model parked next to it.
 *
 * ---------------------------------------------------------------------------
 * TWO RENDER PATHS, ONE SET OF WORDS
 * ---------------------------------------------------------------------------
 * A pinned, scroll-scrubbed sequence is exactly what "reduce motion" is asking
 * us not to do. So the section renders one of two trees:
 *
 *   pinned   — the default. Sticky stage, GSAP timeline, scrubbed camera.
 *   static   — reduced motion. An ordinary editorial section with the same
 *              copy and both pieces, nothing hidden and nothing pinned.
 *
 * The two trees share `STORY` and nothing else, because they genuinely are two
 * different layouts — but the words are written once, so they cannot drift.
 *
 * The static path also covers the case where the scrub would be unpleasant
 * rather than impressive: on a short window, three viewports of pinned scroll
 * for one subject is a lot of scrolling to ask for. Nothing is lost, because
 * every beat's copy is present in both.
 *
 * ---------------------------------------------------------------------------
 * WHERE THE COPY SITS, AND WHY IT IS ONE BREAKPOINT
 * ---------------------------------------------------------------------------
 * Beside the piece at `lg` and up, below it underneath — because below roughly
 * 1024px there is no honest way to fit a piece that is half the frame wide and
 * a column of text side by side.
 *
 * That single condition is read in two places: Tailwind's `lg:` variants here,
 * and `COPY_BESIDE_QUERY` in `StoryStage.jsx`, which uses it to lift the piece
 * into the upper part of the frame so it never sits behind the copy. The two
 * must stay in step — if the breakpoint moves, move both. It is written out
 * explicitly in each rather than shared, because a CSS breakpoint and a JS
 * media query cannot be the same constant, and pretending otherwise would hide
 * the coupling instead of exposing it.
 */
const STORY = {
  opening: {
    eyebrow: '02 — The Craft',
    heading: 'Crafted for moments that become memories.',
  },
  bench: {
    eyebrow: 'At the bench',
    heading: 'Every piece begins at the bench.',
    body: 'Shaped, filed and finished by hand before it ever reaches a display case.',
    note: 'We work in small runs. A necklace is not stamped out; it is balanced, re-set and polished until it sits correctly against the collarbone. That is the only way a piece earns the right to be worn on the day someone remembers for the rest of their life.',
  },
  hand: {
    eyebrow: 'Design → Craft → Treasure',
    heading: 'Gold remembers the hand that shaped it.',
    body: 'Bangle, necklace, ring — each form has its own logic. We follow it rather than fight it.',
  },
}

/*
 * Display type inside the pinned stage has to answer to viewport HEIGHT as well
 * as width. The stage is exactly `100dvh`, so a width-only clamp holds its size
 * on a 443px-tall window and pushes the block out of the frame — the same
 * failure the hero's heading had. `min(6vw, 11vh)` caps the size against the
 * shorter of the two axes, and the `rem` floor stops it collapsing on a phone.
 */
const STAGE_HEADING =
  'font-display font-light leading-[1.1] tracking-[-0.015em] text-[clamp(2.125rem,min(6vw,11vh),5.5rem)]'
const STAGE_SUBHEADING =
  'font-display font-light leading-[1.12] tracking-[-0.01em] text-[clamp(1.5rem,min(3.4vw,6.2vh),2.75rem)]'

export function ScrollStory() {
  const reducedMotion = usePrefersReducedMotion()
  return reducedMotion ? <StoryStatic /> : <StoryPinned />
}

/* ==========================================================================
   PINNED — the scroll story
   ======================================================================== */

function StoryPinned() {
  const sectionRef = useRef(null)
  const depthRef = useRef(null)
  const washRef = useRef(null)

  useStoryScroll({ sectionRef, depthRef, washRef })

  return (
    <section
      id={SECTION_IDS.story}
      ref={sectionRef}
      aria-label="The craft story"
      /*
       * No `overflow-hidden` here, deliberately. An overflow-hidden *ancestor*
       * of a sticky element becomes that element's scroll container, and the
       * stage would quietly stop sticking. It belongs on the sticky element
       * itself — see the note in Hero.jsx.
       */
      className="relative isolate h-[300vh] bg-champagne"
    >
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        {/* Warm light pool. The story is lit from behind the piece rather than
            from the page background, so the champagne never reads as flat. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(118%_86%_at_50%_38%,#FFFCF4_0%,#F2E9D8_54%,#EBDFC6_100%)]"
        />

        {/* The stage. `absolute inset-0` on a wrapper rather than a class on
            Scene3D itself: Scene3D's own root is `relative`, and passing both
            `relative` and `absolute` in one class string makes the winner
            depend on stylesheet order. */}
        <div className="absolute inset-0">
          <Scene3D
            className="h-full w-full"
            piece="necklace"
            secondPiece="bangle"
            mode="story"
            lightingIntensity={1}
            cameraPosition={[0, 0.34, 6.6]}
            fov={34}
          />
        </div>

        {/* Light falls away for the inspection beat. A vignette rather than a
            scrim: the palette is never allowed to go dark, so the edges warm
            off instead of blackening. */}
        <div
          ref={depthRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(108%_82%_at_50%_44%,transparent_24%,rgba(33,30,25,0.18)_100%)] opacity-0"
        />

        {/* Legibility bed for the copy when it sits below the piece. Sits above
            the vignette so the two cancel out where they overlap — which is
            what keeps the lower third readable without lightening the middle
            where the piece is. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[52%] bg-[linear-gradient(180deg,transparent_0%,rgba(242,233,216,0.5)_34%,rgba(242,233,216,0.93)_100%)] lg:hidden"
        />

        {/* ---- The beats -------------------------------------------------
            Three blocks, one position each, all absolutely placed against the
            stage so the 3D layer keeps the whole frame. `useStoryScroll`
            targets them by `[data-story-beat]` in DOM order.

            Beats 1 and 2 carry `opacity-0` as their CSS resting state so they
            cannot flash on top of the title card in the window between first
            paint and the GSAP timeline being built. GSAP's `autoAlpha` writes
            inline styles, which win over the class, so the timeline is free to
            bring them in normally. */}
        <div className="pointer-events-none absolute inset-0 z-30">
          {/* Beat 0 — the title card. Present at rest; it only ever leaves. */}
          <div
            data-story-beat
            className="absolute inset-0 flex flex-col items-center justify-center px-[clamp(1.25rem,4vw,3rem)] text-center"
          >
            <p className="eyebrow text-gold-deep">{STORY.opening.eyebrow}</p>
            <h2 className={`${STAGE_HEADING} mt-5 max-w-[15ch] text-ink sm:mt-7`}>
              {STORY.opening.heading}
            </h2>
          </div>

          {/* Beat 1 — at the bench. The piece is right of centre, so the copy
              takes the left at `lg` and the bottom below it. */}
          <div
            data-story-beat
            className="absolute inset-0 flex items-end justify-start opacity-0 lg:items-center"
          >
            <div className="shell w-full pb-[15vh] lg:pb-0">
              <div className="max-w-[30rem] lg:max-w-[16rem] xl:max-w-[24rem]">
                <p className="eyebrow text-gold-deep">{STORY.bench.eyebrow}</p>
                <h3 className={`${STAGE_SUBHEADING} mt-4 text-ink`}>
                  {STORY.bench.heading}
                </h3>
                <p className="mt-4 text-[0.9rem] leading-relaxed text-ink/80">
                  {STORY.bench.body}
                </p>
                <p className="mt-4 text-[0.85rem] leading-relaxed text-muted">
                  {STORY.bench.note}
                </p>
              </div>
            </div>
          </div>

          {/* Beat 2 — the handoff. The bangle sits left of centre, so the copy
              mirrors beat 1 and takes the right. */}
          <div
            data-story-beat
            className="absolute inset-0 flex items-end justify-end opacity-0 lg:items-center"
          >
            <div className="shell w-full pb-[15vh] lg:pb-0">
              <div className="ml-auto max-w-[30rem] lg:max-w-[16rem] xl:max-w-[24rem]">
                <p className="eyebrow text-gold-deep">{STORY.hand.eyebrow}</p>
                <h3 className={`${STAGE_SUBHEADING} mt-4 text-ink`}>
                  {STORY.hand.heading}
                </h3>
                <p className="mt-4 text-[0.9rem] leading-relaxed text-ink/80">
                  {STORY.hand.body}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ivory wash over the tail. BrandStatement is ivory, so the boundary
            between the two sections disappears — the mirror of the champagne
            wash the hero runs into this section.

            Above the copy, not below it: the whole frame dissolves, copy
            included, which is what makes it read as a cut to the next shot
            rather than as text quietly fading out under a rectangle. */}
        <div
          ref={washRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-40 bg-ivory opacity-0"
        />
      </div>
    </section>
  )
}

/* ==========================================================================
   STATIC — reduced motion
   ======================================================================== */

/**
 * The same story told as a normal scrolling section.
 *
 * Everything the pinned path narrates in time is laid out in space here: the
 * title, the bench, both pieces, the handoff, and the closing line. Nothing is
 * conditional and nothing is hidden, so a reduced-motion visitor gets the
 * complete section rather than a downgraded one.
 */
function StoryStatic() {
  const scope = useScrollReveal({ y: 30, blur: 6, stagger: 0.1 })

  return (
    <section
      id={SECTION_IDS.story}
      ref={scope}
      aria-label="The craft story"
      className="relative isolate overflow-hidden bg-champagne py-28 md:py-40"
    >
      <div className="shell relative">
        <div className="flex flex-col items-center text-center">
          <p data-reveal className="eyebrow text-gold-deep">
            {STORY.opening.eyebrow}
          </p>
          <h2 data-reveal className="display-lg mt-6 max-w-[18ch] text-ink">
            {STORY.opening.heading}
          </h2>
        </div>

        <div className="mt-16 grid items-center gap-10 md:mt-20 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-7">
            <Scene3D
              className="h-[74vw] max-h-[30rem] w-full md:h-[34rem] lg:h-[38rem] lg:max-h-none"
              piece="necklace"
              lightingIntensity={0.95}
              cameraPosition={[0.9, 0.2, 5.1]}
              fov={32}
            />
          </div>

          <div className="lg:col-span-5 lg:pl-8">
            <p
              data-reveal
              className="font-display text-[clamp(1.4rem,3.4vw,2.2rem)] leading-[1.3] font-light text-ink"
            >
              {STORY.bench.heading}
            </p>
            <p data-reveal className="measure mt-7 text-[0.92rem] leading-relaxed text-muted">
              {STORY.bench.body} {STORY.bench.note}
            </p>
            <p data-reveal className="eyebrow mt-10 text-[0.55rem] text-gold-deep">
              {STORY.hand.eyebrow}
            </p>
          </div>
        </div>

        <div className="mt-20 grid items-center gap-10 lg:mt-28 lg:grid-cols-12 lg:gap-6">
          <div className="order-2 lg:order-1 lg:col-span-5">
            <p
              data-reveal
              className="font-display text-[clamp(1.4rem,3.4vw,2.2rem)] leading-[1.3] font-light text-ink"
            >
              {STORY.hand.heading}
            </p>
            <p data-reveal className="measure mt-7 text-[0.92rem] leading-relaxed text-muted">
              {STORY.hand.body}
            </p>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-7">
            <Scene3D
              className="h-[68vw] max-h-[28rem] w-full md:h-[30rem] lg:h-[34rem] lg:max-h-none"
              piece="bangle"
              lightingIntensity={0.95}
              cameraPosition={[-0.7, 0.35, 5.2]}
              fov={32}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default ScrollStory
