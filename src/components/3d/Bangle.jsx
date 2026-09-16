import { Model } from './Model'

/** Bangle — satin finish by default; the real piece is brushed, not mirror-polished. */
export function Bangle({ grade = 'satin', ...props }) {
  return <Model type="bangle" grade={grade} {...props} />
}

export default Bangle
