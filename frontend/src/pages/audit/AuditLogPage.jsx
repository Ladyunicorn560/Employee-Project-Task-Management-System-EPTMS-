import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, Paper
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/tables/DataTable';
import AppButton from '../../components/ui/AppButton';
import auditLogService from '../../services/auditLogService';
import { formatDate } from '../../utils/dateUtils';

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filter & Pagination state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Details Modal State
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditLogService.getAll({
        page: page + 1,
        limit: pageSize,
        search: search || undefined
      });
      setLogs(res.data || []);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load system audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(0);
  };

  const handleOpenDetails = (log) => {
    setSelectedLog(log);
  };

  const handleCloseDetails = () => {
    setSelectedLog(null);
  };

  const columns = [
    {
      id: 'createdDate',
      label: 'Timestamp',
      minWidth: 160,
      render: (val) => formatDate(val),
    },
    {
      id: 'action',
      label: 'Action',
      minWidth: 100,
      render: (val) => (
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{
            px: 1,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: val === 'DELETE' ? '#FEE2E2' : val === 'UPDATE' ? '#FEF3C7' : '#D1FAE5',
            color: val === 'DELETE' ? '#991B1B' : val === 'UPDATE' ? '#92400E' : '#065F46'
          }}
        >
          {val}
        </Typography>
      ),
    },
    {
      id: 'entityName',
      label: 'Entity Class',
      minWidth: 120,
    },
    {
      id: 'entityId',
      label: 'Entity ID',
      minWidth: 80,
    },
    {
      id: 'changedBy',
      label: 'Performed By',
      minWidth: 160,
      render: (val) => val || 'System/Bootstrap',
    },
    {
      id: 'ipAddress',
      label: 'Source IP Address',
      minWidth: 130,
      render: (val) => val || '—',
    },
    {
      id: 'actions',
      label: 'Values Detail',
      align: 'right',
      minWidth: 100,
      render: (_, row) => (
        <AppButton
          variant="outlined"
          size="small"
          startIcon={<VisibilityOutlinedIcon />}
          onClick={() => handleOpenDetails(row)}
        >
          Inspect
        </AppButton>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Audit Logs"
        description="Review system configuration edits, project changes, employee status updates, and overall system audits."
        breadcrumbItems={[{ label: 'Administration' }, { label: 'Audit Logs' }]}
      />

      <Card sx={{ mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={3}>
              <SearchBar
                value={search}
                onChange={handleSearchChange}
                placeholder="Search entities or actions..."
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        rows={logs}
        loading={loading}
        paginationMode="server"
        rowCount={totalCount}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
        emptyMessage="No matching system audit log entries found."
      />

      {/* Audit Log Details Dialog */}
      <Dialog open={Boolean(selectedLog)} onClose={handleCloseDetails} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 700 }}>System Change Details</DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: '#F8FAFC' }}>
          {selectedLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, my: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Entity Class & ID</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {selectedLog.entityName} (ID: {selectedLog.entityId})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Action Type</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {selectedLog.action}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Timestamp & IP</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {formatDate(selectedLog.createdDate)} ({selectedLog.ipAddress || 'System'})
                  </Typography>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Prior State (Old Values)</Typography>
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', backgroundColor: '#FFF' }}>
                    {selectedLog.oldValues ? (
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(JSON.parse(selectedLog.oldValues), null, 2)}
                      </pre>
                    ) : (
                      <Typography variant="caption" color="text.disabled">No prior state recorded.</Typography>
                    )}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Resultant State (New Values)</Typography>
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', backgroundColor: '#FFF' }}>
                    {selectedLog.newValues ? (
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(JSON.parse(selectedLog.newValues), null, 2)}
                      </pre>
                    ) : (
                      <Typography variant="caption" color="text.disabled">No resultant state recorded.</Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <AppButton variant="primary" onClick={handleCloseDetails}>Close View</AppButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogPage;
