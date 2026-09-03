type AlertProps = {
    message : string;
    handleClick : () => void
}

export default function Alert({message, handleClick} : AlertProps) {

    return (
        <div
  style={{
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.45)',
    padding: '1rem',
  }}
>
  <div
    style={{
      background: '#202124',
      color: '#e8eaed',
      padding: '1.25rem 1.5rem',
      borderRadius: 16,
      maxWidth: 'min(90vw, 22rem)',
      width: '100%',
      textAlign: 'center',
      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.45)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
    }}
  >
    <span style={{ lineHeight: 1.4 }}>{message}</span>
    <button
      type="button"
      onClick={handleClick}
      style={{
        background: '#8ab4f8',
        color: '#202124',
        border: 'none',
        borderRadius: 100,
        padding: '0.5rem 1.25rem',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      Okay
    </button>
  </div>
</div>
    )
}