import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, CardContent, Typography, Box, Stack, Button, Chip, Divider
} from '@mui/material';

import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';

import { ROUTES } from '../../../constants/routes';
import { ROLES } from '../../../constants/roles';
import useAuth from '../../../hooks/useAuth';

const TimecardAnalyticsCard = ({ timecardData }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;
  const isPM = user?.roleName === ROLES.PROJECT_MANAGER;
  const isEmployee = user?.roleName === ROLES.EMPLOYEE;

  const pendingManager = timecardData?.pendingManager || 0;
  const pendingFinancial = timecardData?.pendingFinancial || 0;
  const financialApproved = timecardData?.financialApproved || 0;
  const totalApprovedBilling = timecardData?.totalApprovedBilling || 0;
  const myPending = timecardData?.myPending || 0;
  const myTotal = timecardData?.myTotal || 0;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        height: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        border: '1px solid #E2E8F0',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)'
      }}
    >
      <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(25,118,210,0.3)'
              }}
            >
              <AccessTimeRoundedIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>
                Timecards & Financial Billing
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Role Context: <strong>{user?.roleName}</strong>
              </Typography>
            </Box>
          </Box>

          <Button
            size="small"
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => navigate(ROUTES.TIMECARDS_CREATE)}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)'
            }}
          >
            Submit Timecard
          </Button>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* Role Specific Stats */}
        <Box sx={{ flex: 1 }}>
          {isAdmin ? (
            /* Admin / Project Owner View */
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: pendingFinancial > 0 ? '#E3F2FD' : '#F1F5F9',
                  border: '1px solid',
                  borderColor: pendingFinancial > 0 ? '#90CAF9' : '#CBD5E1',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Stage 2: Pending Financial Clearance
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#1565C0' }}>
                    {pendingFinancial} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Timecards</span>
                  </Typography>
                </Box>
                <Chip icon={<HourglassEmptyRoundedIcon />} label="Owner Action Needed" color="info" size="small" sx={{ fontWeight: 700 }} />
              </Box>

              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1, p: 2, borderRadius: 2, backgroundColor: '#FFF8E1', border: '1px solid #FFE082' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700 }}>
                    Stage 1: Pending Manager
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#B76E00' }}>
                    {pendingManager}
                  </Typography>
                </Box>

                <Box sx={{ flex: 1, p: 2, borderRadius: 2, backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700 }}>
                    Approved Project Billing
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#2E7D32' }}>
                    ₹{totalApprovedBilling?.toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          ) : isPM ? (
            /* Manager View */
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: pendingManager > 0 ? '#FFF8E1' : '#F1F5F9',
                  border: '1px solid',
                  borderColor: pendingManager > 0 ? '#FFE082' : '#CBD5E1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Stage 1: Awaiting Manager Review
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#B76E00' }}>
                    {pendingManager} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Timecards</span>
                  </Typography>
                </Box>
                <Chip icon={<HourglassEmptyRoundedIcon />} label="Manager Action Needed" color="warning" size="small" sx={{ fontWeight: 700 }} />
              </Box>

              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1, p: 2, borderRadius: 2, backgroundColor: '#E3F2FD', border: '1px solid #90CAF9' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700 }}>
                    Stage 2: Pending Owner
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1565C0' }}>
                    {pendingFinancial}
                  </Typography>
                </Box>

                <Box sx={{ flex: 1, p: 2, borderRadius: 2, backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700 }}>
                    Financial Approved
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#2E7D32' }}>
                    {financialApproved}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          ) : (
            /* Employee View */
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: '#E3F2FD',
                  border: '1px solid #90CAF9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    My Timecards Submitted
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#1565C0' }}>
                    {myTotal} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Timecards</span>
                  </Typography>
                </Box>
                {myPending > 0 ? (
                  <Chip label={`${myPending} Pending Approval`} color="warning" size="small" sx={{ fontWeight: 700 }} />
                ) : (
                  <Chip label="All Up to Date" color="success" size="small" sx={{ fontWeight: 700 }} />
                )}
              </Box>
            </Stack>
          )}
        </Box>

        {/* Footer Action Navigation */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="text"
            color="primary"
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={() => navigate(ROUTES.TIMECARDS)}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Open Timecard & Billing Dashboard
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TimecardAnalyticsCard;
