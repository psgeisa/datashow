import { nanoid } from 'nanoid'

const STORAGE_KEY = 'datashow_solo_player_id'

/** ID anônimo persistente (localStorage) usado para acumular estatísticas
 * do treino solo entre sessões, sem exigir login. */
export function getSoloPlayerId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = nanoid(21)
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}
