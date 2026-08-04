import { Button, CircularProgress } from '@mui/material';

/**
 * AppButton
 * Reusable MUI button with EPTMS variants.
 *
 * Variants:
 *  - primary   (default) — filled blue
 *  - secondary           — filled teal
 *  - danger              — filled red
 *  - success             — filled green
 *  - outlined            — outlined with border
 *
 * @param {string} variant - 'primary'|'secondary'|'danger'|'success'|'outlined'
 * @param {boolean} loading - Show spinner and disable button
 * @param {ReactNode} children
 * @param {object} rest - All other MUI Button props
 */
const AppButton = ({
  variant = 'primary',
  loading = false,
  children,
  disabled,
  startIcon,
  ...rest
}) => {
  const variantMap = {
    primary: { muiVariant: 'contained', color: 'primary' },
    secondary: { muiVariant: 'contained', color: 'secondary' },
    danger: { muiVariant: 'contained', color: 'error' },
    success: { muiVariant: 'contained', color: 'success' },
    outlined: { muiVariant: 'outlined', color: 'primary' },
  };

  const { muiVariant, color } = variantMap[variant] || variantMap.primary;

  return (
    <Button
      variant={muiVariant}
      color={color}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      {...rest}
    >
      {children}
    </Button>
  );
};

export default AppButton;
