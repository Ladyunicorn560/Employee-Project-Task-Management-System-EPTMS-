import { Breadcrumbs, Typography, Link, Box } from '@mui/material';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

/**
 * AppBreadcrumbs
 * Dynamic breadcrumb navigation component.
 *
 * @param {Array<{label: string, to?: string}>} items - Breadcrumb items.
 *   Last item is current page (no link). All previous items are clickable.
 * @param {boolean} showHome - Whether to prepend a Home/Dashboard link (default: true)
 *
 * Usage:
 *   <AppBreadcrumbs items={[
 *     { label: 'Employees' },
 *     { label: 'John Doe' }
 *   ]} />
 */
const AppBreadcrumbs = ({ items = [], showHome = true }) => {
  const navigate = useNavigate();

  const allItems = showHome
    ? [{ label: 'Dashboard', to: ROUTES.DASHBOARD, icon: true }, ...items]
    : items;

  return (
    <Box sx={{ mb: 2.5 }}>
      <Breadcrumbs
        separator={
          <NavigateNextRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
        }
        aria-label="breadcrumb"
      >
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;

          if (isLast) {
            return (
              <Typography
                key={index}
                variant="body2"
                color="text.primary"
                fontWeight={600}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                {item.label}
              </Typography>
            );
          }

          return (
            <Link
              key={index}
              component="button"
              variant="body2"
              color="primary"
              underline="hover"
              onClick={() => item.to && navigate(item.to)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: item.to ? 'pointer' : 'default',
                fontWeight: 500,
                border: 'none',
                background: 'none',
                p: 0,
              }}
            >
              {item.icon && <HomeRoundedIcon sx={{ fontSize: 15 }} />}
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default AppBreadcrumbs;
