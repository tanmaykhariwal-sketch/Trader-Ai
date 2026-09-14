/**
 * Symbols in the ticker universe that are an index or an index-tracking ETF
 * rather than an individual tradable equity. Nobody "buys 1 share of the
 * SENSEX" — feeding these through the same AI buy-zone/position-sizing
 * pipeline as a real stock produces technically-computed but nonsensical
 * output, so callers use this to skip that treatment for these symbols.
 */
export const INDEX_SYMBOLS: ReadonlySet<string> = new Set(['SENSEX', 'SENSEXADD']);

export function isIndexSymbol(symbol: string): boolean {
  return INDEX_SYMBOLS.has(symbol);
}
