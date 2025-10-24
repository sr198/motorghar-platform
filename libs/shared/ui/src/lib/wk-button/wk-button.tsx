import styles from './wk-button.module.css'

export interface WkButtonProps {
  label: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}

export function WkButton({
  label,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
}: WkButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${styles.button} ${styles[variant]} ${styles[size]}`}
    >
      {label}
    </button>
  )
}

export default WkButton