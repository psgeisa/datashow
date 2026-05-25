/**
 * Deterministic option shuffle based on question UUID.
 *
 * Rotates the options array LEFT by (seed % n) positions, where seed comes
 * from the last 4 hex digits of the question ID. The same question always
 * receives the same shuffle — no DB state required.
 *
 * Apply in choose-category, next, reveal, and answer routes so that the
 * correct_index presented to the client is consistent across all calls.
 */
export function shuffleOptionsForQuestion(
  questionId: string,
  options: string[],
  correctIndex: number,
): { options: string[]; correct_index: number } {
  const n = options.length
  if (n === 0) return { options, correct_index: correctIndex }

  // seed = last 4 hex chars of UUID
  const seed = parseInt(questionId.slice(-4), 16)
  const rotation = seed % n

  // Left rotation: new[i] = old[(i + rotation) % n]
  const shuffled = options.map((_, i) => options[(i + rotation) % n])

  // Adjust correct index for the rotation
  const newCorrectIndex = ((correctIndex - rotation) % n + n) % n

  return { options: shuffled, correct_index: newCorrectIndex }
}
