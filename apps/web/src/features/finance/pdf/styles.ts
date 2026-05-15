import { StyleSheet } from '@react-pdf/renderer';

/**
 * Shared @react-pdf/renderer stylesheet. Mirrors the dashboard's brutalist
 * monochrome look — no gradients, square corners, hairline borders.
 */
export const pdfStyles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#0f1115',
    backgroundColor: '#ffffff',
  },

  // Layout
  section: { marginBottom: 18 },
  row: { flexDirection: 'row', gap: 8 },
  col: { flexDirection: 'column' },

  // Headings
  h1: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  h2: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  h3: { fontSize: 10, fontWeight: 'bold' },
  small: { fontSize: 8, color: '#6b7180' },
  smallMono: { fontSize: 8, color: '#6b7180', fontFamily: 'Courier' },
  label: { fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: '#6b7180' },

  // Borders
  card: {
    borderWidth: 1,
    borderColor: '#0f1115',
    padding: 10,
    marginBottom: 10,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: '#0f1115', marginVertical: 10 },
  hairline: { borderBottomWidth: 0.5, borderBottomColor: '#9aa0aa', marginVertical: 4 },

  // Badges
  badge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#0f1115',
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Tables
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#0f1115',
    paddingVertical: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cccccc',
    paddingVertical: 4,
  },
  tableCell: { fontSize: 9 },
  tableCellMono: { fontSize: 9, fontFamily: 'Courier' },

  // Color tones
  positive: { color: '#0f1115' },
  negative: { color: '#a83232' },
  muted: { color: '#6b7180' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    fontSize: 7,
    color: '#9aa0aa',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
