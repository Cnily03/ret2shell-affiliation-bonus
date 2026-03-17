const styles: Record<string, React.CSSProperties> = {
  box: {
    padding: '14px 18px',
    background: 'var(--card-bg)',
    border: '1px solid var(--yellow)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: 14,
    lineHeight: 1.6,
  },
}

export default function Warning({ children }: { children: React.ReactNode }) {
  return <div style={styles.box}>{children}</div>
}
