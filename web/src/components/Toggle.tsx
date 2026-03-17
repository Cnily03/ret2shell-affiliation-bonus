const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    userSelect: 'none',
    fontSize: 14,
    color: 'var(--text-secondary)',
  },
  track: {
    position: 'relative',
    width: 40,
    height: 22,
    borderRadius: 11,
    transition: 'background 0.2s',
  },
  thumb: {
    position: 'absolute',
    top: 3,
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: '#fff',
    transition: 'left 0.2s',
  },
}

export default function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <div style={styles.wrapper} onClick={() => onChange(!checked)}>
      <div
        style={{
          ...styles.track,
          background: checked ? 'var(--brand)' : 'var(--bg-accent)',
        }}
      >
        <div style={{ ...styles.thumb, left: checked ? 21 : 3 }} />
      </div>
      {label && <span>{label}</span>}
    </div>
  )
}
