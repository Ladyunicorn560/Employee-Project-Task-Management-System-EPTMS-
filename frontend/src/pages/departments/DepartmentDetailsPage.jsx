import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Grid, Typography, Divider, Alert } from '@mui/material';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import CorporateFareRoundedIcon from '@mui/icons-material/CorporateFareRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';

import PageHeader from '../../components/common/PageHeader';
import AppButton from '../../components/ui/AppButton';
import PageLoader from '../../components/ui/PageLoader';

import useAuth from '../../hooks/useAuth';
import departmentService from '../../services/departmentService';
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

const getMockManager = (deptName) => {
  const managers = {
    'engineering': 'Sarah Connor (Engineering Director)',
    'sales': 'Michael Scott (Sales Head)',
    'marketing': 'Ariana Grande (Marketing PM)',
    'human resources': 'Toby Flenderson (HR Specialist)',
    'finance': 'Oscar Martinez (Finance Manager)',
  };
  const key = String(deptName).toLowerCase();
  for (const [k, v] of Object.entries(managers)) {
    if (key.includes(k)) return v;
  }
  return 'No Manager Assigned';
};

/**
 * DepartmentDetailsPage
 * Renders detail values for selected department.
 */
const DepartmentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;

  const [dept, setDept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await departmentService.getById(id);
      setDept(data);
    } catch (err) {
      console.error('Failed to load department details:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) {
    return <PageLoader message="Loading department..." />;
  }

  if (error || !dept) {
    return (
      <Box>
        <AppButton variant="outlined" startIcon={<KeyboardArrowLeftRoundedIcon />} onClick={() => navigate(ROUTES.DEPARTMENTS)}>
          Back to List
        </AppButton>
        <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
          Failed to fetch department details. The record does not exist or has been removed.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={dept.departmentName}
        description="Department specifications and managers assignment details."
        breadcrumbItems={[
          { label: 'Departments', to: ROUTES.DEPARTMENTS },
          { label: dept.departmentName },
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <AppButton
              variant="outlined"
              startIcon={<KeyboardArrowLeftRoundedIcon />}
              onClick={() => navigate(ROUTES.DEPARTMENTS)}
            >
              Back to List
            </AppButton>
            {isAdmin && (
              <AppButton
                variant="primary"
                startIcon={<ModeEditOutlineOutlinedIcon />}
                onClick={() => navigate(`${ROUTES.DEPARTMENTS}/${id}/edit`)}
              >
                Edit Department
              </AppButton>
            )}
          </Box>
        }
      />

      <Grid container spacing={3}>
        {/* Core Info */}
        <Grid item xs={12} md={7}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <CorporateFareRoundedIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Department Information
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ mt: 1 }}>
                <DetailInfoRow label="Department Name" value={dept.departmentName} />
                <DetailInfoRow label="Description" value={dept.description} />
                <DetailInfoRow label="Assigned Manager" value={getMockManager(dept.departmentName)} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Aggregates and Audit */}
        <Grid item xs={12} md={5}>
          {/* Members Count */}
          <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <PeopleAltRoundedIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Department Hierarchy
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ mt: 1 }}>
                <DetailInfoRow label="Active Members" value={dept.employeeCount ?? 0} />
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
                <DetailInfoRow label="Created Date" value={formatDate(dept.createdDate)} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DepartmentDetailsPage;
