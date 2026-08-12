import { useState } from 'react';
import { Box, Card, Avatar, Typography, Tooltip, IconButton } from '@mui/material';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

import CommentEditor from './CommentEditor';
import { formatDateTime } from '../../../utils/dateUtils';

/**
 * CommentCard
 * Renders a single comment block with author, timestamp, content,
 * and conditional edit/delete controls.
 *
 * @param {object} comment
 * @param {number} currentUserId
 * @param {boolean} isAdminOrPm - High level edit/delete override
 * @param {function} onUpdate - Callback to update content (text)
 * @param {function} onDelete - Callback to delete comment
 */
const CommentCard = ({ comment, currentUserId, isAdminOrPm, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Author details
  const author = comment.author || {};
  const isAuthor = author.id === currentUserId;
  const canModify = isAuthor || isAdminOrPm;

  const authorName = author.firstName ? `${author.firstName} ${author.lastName}` : 'System';
  const authorInitial = author.firstName?.[0] || 'S';

  const handleUpdate = async (newText) => {
    setLoading(true);
    try {
      await onUpdate(comment.id, newText);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isUpdated = comment.updatedDate && comment.updatedDate !== comment.createdDate;

  return (
    <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, mb: 2, display: 'flex', gap: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
      <Avatar sx={{ width: 38, height: 38, bgcolor: 'primary.light', fontWeight: 700 }}>
        {authorInitial}
      </Avatar>

      <Box sx={{ flex: 1 }}>
        {/* Author Header */}
        <Box sx={{ display: 'flex', justifyBetween: 'center', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
              {authorName}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {formatDateTime(comment.createdDate)}
            </Typography>
            {isUpdated && (
              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                (edited)
              </Typography>
            )}
          </Box>

          {canModify && !isEditing && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {isAuthor && (
                <Tooltip title="Edit comment">
                  <IconButton size="small" onClick={() => setIsEditing(true)}>
                    <ModeEditOutlineOutlinedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Delete comment">
                <IconButton size="small" color="error" onClick={() => onDelete(comment.id)}>
                  <DeleteOutlineRoundedIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* Content Body */}
        {isEditing ? (
          <CommentEditor
            initialText={comment.content}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            submitLabel="Save"
            loading={loading}
          />
        ) : (
          <Typography
            variant="body2"
            color="text.primary"
            sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
          >
            {comment.content}
          </Typography>
        )}
      </Box>
    </Card>
  );
};

export default CommentCard;
