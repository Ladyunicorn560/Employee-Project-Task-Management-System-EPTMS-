import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Divider, Pagination, Alert } from '@mui/material';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import { toast } from 'react-toastify';

import CommentCard from './CommentCard';
import CommentEditor from './CommentEditor';
import EmptyState from '../../../components/ui/EmptyState';
import PageLoader from '../../../components/ui/PageLoader';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

import useAuth from '../../../hooks/useAuth';
import commentService from '../../../services/commentService';
import projectService from '../../../services/projectService';
import { ROLES } from '../../../constants/roles';

/**
 * TaskCommentsTab
 * Comments tab panel inside TaskDetailsPage.
 * Allows participants to post, edit, and delete text comments.
 *
 * @param {object} task - Parent task details object
 */
const TaskCommentsTab = ({ task }) => {
  const { user } = useAuth();
  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;
  const isPM = user?.roleName === ROLES.PROJECT_MANAGER;

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [posting, setPosting] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(5); // Show 5 comments per page

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // PM ownership override check
  const [project, setProject] = useState(null);
  useEffect(() => {
    if (!task?.projectId) return;
    const fetchProj = async () => {
      try {
        const p = await projectService.getById(task.projectId);
        setProject(p);
      } catch (err) {
        console.error('Failed to load project details for comment authorization:', err);
      }
    };
    fetchProj();
  }, [task?.projectId]);

  const isAdminOrPm = isAdmin || (isPM && project?.projectManager?.id === user?.id);

  const fetchComments = useCallback(async () => {
    if (!task?.id) return;
    setLoading(true);
    setError(false);
    try {
      const res = await commentService.getByTaskId(task.id, {
        page,
        limit,
        sortBy: 'CreatedDate',
        sortOrder: 'DESC',
      });
      // Handle array or paginated response format
      const dataList = res.data || [];
      setComments(dataList);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [task?.id, page, limit]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePostComment = async (text) => {
    setPosting(true);
    try {
      await commentService.createInTask(task.id, { content: text });
      toast.success('Comment posted successfully.');
      setPage(1); // Go to first page
      fetchComments();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to post comment.';
      toast.error(msg);
    } finally {
      setPosting(false);
    }
  };

  const handleUpdateComment = async (commentId, newText) => {
    try {
      await commentService.update(commentId, { content: newText });
      toast.success('Comment updated successfully.');
      fetchComments();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update comment.';
      toast.error(msg);
      throw err;
    }
  };

  const handleDeleteRequest = (id) => setDeleteId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await commentService.remove(deleteId);
      toast.success('Comment deleted successfully.');
      fetchComments();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete comment.';
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
        Conversation Feed
      </Typography>

      {/* Editor Box */}
      <Box sx={{ mb: 4 }}>
        <CommentEditor
          onSubmit={handlePostComment}
          loading={posting}
          submitLabel="Post Comment"
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Comments List */}
      {loading ? (
        <PageLoader message="Loading comments list..." />
      ) : error ? (
        <Alert severity="error">Failed to fetch comments. Please try again.</Alert>
      ) : comments.length === 0 ? (
        <EmptyState
          title="No Comments Yet"
          description="Start the conversation by posting the first comment on this task."
          icon={ForumRoundedIcon}
        />
      ) : (
        <Box>
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              isAdminOrPm={isAdminOrPm}
              onUpdate={handleUpdateComment}
              onDelete={handleDeleteRequest}
            />
          ))}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="small"
              />
            </Box>
          )}
        </Box>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Comment"
        message="Are you sure you want to permanently delete this comment? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmColor="error"
        variant="delete"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
};

export default TaskCommentsTab;
