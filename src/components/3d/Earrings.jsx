import { Model } from './Model'

/** Earrings — always rendered as a mirrored pair. */
export function Earrings({ grade = 'polished', ...props }) {
  return <Model type="earrings" grade={grade} {...props} />
}

export default Earrings
