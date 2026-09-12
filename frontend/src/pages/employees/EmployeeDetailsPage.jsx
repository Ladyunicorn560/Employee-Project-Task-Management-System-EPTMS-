import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Grid, Typography, Divider, Alert,
} from '@mui/material';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import ContactMailOutlinedIcon from '@mui/icons-material/ContactMailOutlined';
import CorporateFareRoundedIcon from '@mui/icons-material/CorporateFareRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';

import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import AppButton from '../../components/ui/AppButton';
import PageLoader from '../../components/ui/PageLoader';

import useAuth from '../../hooks/useAuth';
import employeeService from '../../services/employeeService';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

/**
 * DetailInfoRow
 * Visual alignment row helper for details lists.
 */
const DetailInfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
    <Typography variant="body2" color="text.secondary" sx={{ width: { sm: 180 }, fontWeight: 500, flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
      {value ?? '—'}
    </Typography>
  </Box>
);

/**
 * EmployeeDetailsPage
 * Renders complete profile view for a selected employee.
 */
const EmployeeDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await employeeService.getById(id);
      setEmployee(data);
    } catch (err) {
      console.error('Failed to load employee details:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) {
    return <PageLoader message="Loading employee profile..." />;
  }

  if (error || !employee) {
    return (
      <Box>
        <AppButton variant="outlined" startIcon={<KeyboardArrowLeftRoundedIcon />} onClick={() => navigate(ROUTES.EMPLOYEES)}>
          Back to List
        </AppButton>
        <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
          Failed to fetch employee details. The record may have been deleted or is unavailable.
        </Alert>
      </Box>
    );
  }

  const displayName = `${employee.firstName} ${employee.lastName}`;
  const empCode = `EMP-${String(employee.id).padStart(4, '0')}`;

  return (
    <Box>
      <PageHeader
        title={displayName}
        description={`Record code: ${empCode}`}
        breadcrumbItems={[{ label: 'Employees', to: ROUTES.EMPLOYEES }, { label: displayName }]}
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <AppButton
              variant="outlined"
              startIcon={<KeyboardArrowLeftRoundedIcon />}
              onClick={() => navigate(ROUTES.EMPLOYEES)}
            >
              Back to List
            </AppButton>
            {isAdmin && (
              <AppButton
                variant="primary"
                startIcon={<ModeEditOutlineOutlinedIcon />}
                onClick={() => navigate(`${ROUTES.EMPLOYEES}/${id}/edit`)}
              >
                Edit Profile
              </AppButton>
            )}
          </Box>
        }
      />

      <Grid container spacing={3}>
        {/* Left Side: General Profile Card */}
        <Grid item xs={12} md={7}>
          {/* Personal Information */}
          <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <PersonOutlineRoundedIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Personal Information
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ mt: 1 }}>
                <DetailInfoRow label="First Name" value={employee.firstName} />
                <DetailInfoRow label="Last Name" value={employee.lastName} />
                <DetailInfoRow label="Employee ID" value={empCode} />
                <DetailInfoRow label="Status" value={<StatusChip status={employee.status} />} />
              </Box>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <ContactMailOutlinedIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Contact & Account
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ mt: 1 }}>
                <DetailInfoRow label="Email Address" value={employee.email} />
                <DetailInfoRow label="Phone Number" value={employee.phone} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: Role, Department, and Audit Logs */}
        <Grid item xs={12} md={5}>
          {/* Assignment Information */}
          <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <CorporateFareRoundedIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Company Details
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ mt: 1 }}>
                <DetailInfoRow label="Department" value={employee.department?.name} />
                <DetailInfoRow label="Assigned Role" value={employee.role?.name} />
                <DetailInfoRow
                  label="Reporting Manager"
                  value={
                    employee.manager
                      ? `${employee.manager.name || `${employee.manager.firstName || ''} ${employee.manager.lastName || ''}`.trim()}${employee.manager.email ? ` (${employee.manager.email})` : ''}`
                      : employee.ManagerName || 'None / Executive'
                  }
                />
                <DetailInfoRow
                  label="Billing Rate (₹/hr)"
                  value={
                    employee.hourlyRate !== undefined && employee.hourlyRate !== null
                      ? `₹${employee.hourlyRate}/hr`
                      : employee.HourlyRate !== undefined && employee.HourlyRate !== null
                      ? `₹${employee.HourlyRate}/hr`
                      : '—'
                  }
                />
              </Box>
            </CardContent>
          </Card>

          {/* System Audit Trails */}
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
                <DetailInfoRow label="Joined Date" value={formatDate(employee.createdDate)} />
                <DetailInfoRow label="Last Active Session" value={formatDateTime(employee.lastLoginDate)} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeDetailsPage;
