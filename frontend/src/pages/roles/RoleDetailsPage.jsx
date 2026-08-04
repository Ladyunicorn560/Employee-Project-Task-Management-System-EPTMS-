import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Grid, Typography, Divider, Alert } from '@mui/material';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';

import PageHeader from '../../components/common/PageHeader';
import PermissionMatrix from '../../components/common/PermissionMatrix';
import AppButton from '../../components/ui/AppButton';
import PageLoader from '../../components/ui/PageLoader';

import useAuth from '../../hooks/useAuth';
import roleService from '../../services/roleService';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import { formatDate } from '../../utils/dateUtils';

const DetailInfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
    <Typography variant="body2" color="text.secondary" sx={{ width: 180, fontWeight: 500, flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
      {value ?? '—'}
    </Typography>
  </Box>
);

/**
 * RoleDetailsPage
 * Renders detail values for selected access role.
 */
const RoleDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;

  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await roleService.getById(id);
      setRole(data);
    } catch (err) {
      console.error('Failed to load role details:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) {
    return <PageLoader message="Loading role profile..." />;
  }

  if (error || !role) {
    return (
      <Box>
        <AppButton variant="outlined" startIcon={<KeyboardArrowLeftRoundedIcon />} onClick={() => navigate(ROUTES.ROLES)}>
          Back to List
        </AppButton>
        <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
          Failed to fetch role details. The record does not exist or has been removed.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={role.roleName}
        description="System access role privileges and scope configurations."
        breadcrumbItems={[
          { label: 'Roles', to: ROUTES.ROLES },
          { label: role.roleName },
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <AppButton
              variant="outlined"
              startIcon={<KeyboardArrowLeftRoundedIcon />}
              onClick={() => navigate(ROUTES.ROLES)}
            >
              Back to List
            </AppButton>
            {isAdmin && (
              <AppButton
                variant="primary"
                startIcon={<ModeEditOutlineOutlinedIcon />}
                onClick={() => navigate(`${ROUTES.ROLES}/${id}/edit`)}
              >
                Edit Role
              </AppButton>
            )}
          </Box>
        }
      />

      <Grid container spacing={3}>
        {/* Core Metadata */}
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <AdminPanelSettingsRoundedIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Role Information
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ mt: 1 }}>
                <DetailInfoRow label="Role Name" value={role.roleName} />
                <DetailInfoRow label="Description" value={role.description} />
              </Box>
            </CardContent>
          </Card>

          {/* Assigned Permissions View */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, mt: 1 }}>
            Access Policy Matrix
          </Typography>
          <PermissionMatrix value={role.permissions} disabled={true} />
        </Grid>

        {/* Aggregates and Logs */}
        <Grid item xs={12} md={5}>
          {/* Member Count */}
          <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <PeopleAltRoundedIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Members List
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ mt: 1 }}>
                <DetailInfoRow label="Assigned Employees" value={role.employeeCount ?? 0} />
              </Box>
            </CardContent>
          </Card>

          {/* Audit Info */}
          <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <HistoryRoundedIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  System Audit
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ mt: 1 }}>
                <DetailInfoRow label="Created Date" value={formatDate(role.createdDate)} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RoleDetailsPage;
