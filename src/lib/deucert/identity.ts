import { nanoid } from 'nanoid'

const STORAGE_KEY = 'deucert_player_id'

/** ID anônimo persistente (localStorage) usado pra acumular estatísticas
 * de reforço/simulado entre sessões, sem exigir login. */
export function getPlayerId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = nanoid(21)
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}
