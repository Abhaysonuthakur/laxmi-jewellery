import { Model } from './Model'

/** Ring — used by the scroll-controlled 3D ring section (Step 6). */
export function Ring({ grade = 'polished', ...props }) {
  return <Model type="ring" grade={grade} {...props} />
}

export default Ring
