export const RANGE_OPTIONS = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'ytd', label: 'Year to Date' },
];

export function parseRangeParam(searchParams) {
  const r = searchParams?.get?.('range');
  return ['7d', '30d', 'ytd'].includes(r) ? r : '30d';
}
