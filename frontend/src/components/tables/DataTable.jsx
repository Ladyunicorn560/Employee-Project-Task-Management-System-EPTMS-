import {
  Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, TableSortLabel,
  Paper, Checkbox, Chip, Skeleton, Typography,
} from '@mui/material';
import EmptyState from '../ui/EmptyState';
import NoData from '../ui/NoData';
import ErrorState from '../ui/ErrorState';

/**
 * DataTable
 * Reusable enterprise data table with sorting, pagination, loading,
 * empty state, no-data, and error state support.
 *
 * @param {Array<{id, label, align?, minWidth?, sortable?, render?}>} columns
 *   - id: row key to display
 *   - label: column header text
 *   - align: 'left' | 'center' | 'right'
 *   - sortable: boolean — enable sort on this column
 *   - render: (value, row) => ReactNode — custom cell renderer
 *
 * @param {Array<object>} rows - Data rows
 * @param {boolean} loading - Show skeleton rows
 * @param {boolean} error - Show error state
 * @param {function} onRetry - Retry callback for error state
 * @param {string} searchQuery - Current search query (for empty message context)
 *
 * @param {number} total - Total record count (for server-side pagination)
 * @param {number} page - Current page (0-indexed)
 * @param {number} pageSize - Rows per page
 * @param {function} onPageChange - (newPage) => void
 * @param {function} onPageSizeChange - (newSize) => void
 *
 * @param {string} sortBy - Current sort column id
 * @param {'asc'|'desc'} sortOrder - Current sort direction
 * @param {function} onSort - (columnId) => void
 *
 * @param {string} emptyTitle - Empty state title
 * @param {string} emptyDescription - Empty state description
 * @param {ReactNode} emptyIcon - Empty state icon component
 * @param {string} emptyActionLabel - Empty state action button label
 * @param {function} onEmptyAction - Empty state action handler
 *
 * @param {boolean} selectable - Enable row checkboxes
 * @param {Array} selected - Array of selected row IDs
 * @param {function} onSelectChange - (selectedIds) => void
 * @param {string} rowKey - Row unique key field (default: 'id')
 */
const SKELETON_ROWS = 6;

const DataTable = ({
  columns = [],
  rows = [],
  loading = false,
  error = false,
  onRetry,
  searchQuery = '',

  total,
  page = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,

  sortBy,
  sortOrder = 'asc',
  onSort,

  emptyTitle = 'No records found',
  emptyDescription = 'There are no records to display yet.',
  emptyIcon,
  emptyActionLabel,
  onEmptyAction,

  selectable = false,
  selected = [],
  onSelectChange,
  rowKey = 'id',
}) => {
  const totalRows = total ?? rows.length;
  const isAllSelected = rows.length > 0 && selected.length === rows.length;
  const isIndeterminate = selected.length > 0 && selected.length < rows.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectChange?.([]);
    } else {
      onSelectChange?.(rows.map((r) => r[rowKey]));
    }
  };

  const handleSelectRow = (id) => {
    if (selected.includes(id)) {
      onSelectChange?.(selected.filter((s) => s !== id));
    } else {
      onSelectChange?.([...selected, id]);
    }
  };

  const handleSort = (colId) => {
    onSort?.(colId);
  };

  // ─── Error State ───────────────────────────────────────────────
  if (error) {
    return (
      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <ErrorState
          title="Failed to load data"
          message="An error occurred while fetching records. Please try again."
          onRetry={onRetry}
        />
      </Paper>
    );
  }

  // ─── Empty States (only when not loading) ─────────────────────
  if (!loading && rows.length === 0) {
    if (searchQuery) {
      return (
        <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <NoData
            title="No results found"
            description={`No records match "${searchQuery}". Try adjusting your search.`}
            onClear={() => onEmptyAction?.()}
            clearLabel="Clear Search"
          />
        </Paper>
      );
    }
    return (
      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={emptyIcon}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <TableContainer>
        <Table size="medium" stickyHeader>
          {/* ─── Header ───────────────────────────────────────── */}
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox" sx={{ backgroundColor: 'background.default' }}>
                  <Checkbox
                    size="small"
                    indeterminate={isIndeterminate}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align || 'left'}
                  sx={{ minWidth: col.minWidth, backgroundColor: 'background.default', py: 1.5 }}
                  sortDirection={sortBy === col.id ? sortOrder : false}
                >
                  {col.sortable && onSort ? (
                    <TableSortLabel
                      active={sortBy === col.id}
                      direction={sortBy === col.id ? sortOrder : 'asc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {/* ─── Body ─────────────────────────────────────────── */}
          <TableBody>
            {loading
              ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Skeleton variant="rectangular" width={18} height={18} sx={{ borderRadius: 0.5 }} />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.id}>
                        <Skeleton
                          variant="text"
                          width={col.align === 'right' ? '60%' : '80%'}
                          height={20}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows.map((row) => {
                  const isSelected = selected.includes(row[rowKey]);
                  return (
                    <TableRow
                      key={row[rowKey]}
                      selected={isSelected}
                      hover
                      sx={{
                        '&.Mui-selected': { backgroundColor: 'rgba(25,118,210,0.04)' },
                        '&.Mui-selected:hover': { backgroundColor: 'rgba(25,118,210,0.06)' },
                      }}
                    >
                      {selectable && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            onChange={() => handleSelectRow(row[rowKey])}
                          />
                        </TableCell>
                      )}
                      {columns.map((col) => (
                        <TableCell key={col.id} align={col.align || 'left'}>
                          {col.render
                            ? col.render(row[col.id], row)
                            : row[col.id] ?? (
                                <Typography variant="body2" color="text.disabled">
                                  —
                                </Typography>
                              )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ─── Pagination ───────────────────────────────────────── */}
      {(onPageChange || onPageSizeChange) && (
        <TablePagination
          component="div"
          count={totalRows}
          page={page}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPageChange={(_, newPage) => onPageChange?.(newPage)}
          onRowsPerPageChange={(e) => onPageSizeChange?.(parseInt(e.target.value, 10))}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            '& .MuiTablePagination-toolbar': { px: 2 },
          }}
        />
      )}
    </Paper>
  );
};

export default DataTable;
