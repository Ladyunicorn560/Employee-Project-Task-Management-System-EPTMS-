import { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';

/**
 * CommentEditor
 * Input field for comments with Cancel and Submit actions.
 *
 * @param {string} initialText - For edit mode
 * @param {function} onSubmit - Submit callback takes (text)
 * @param {function} onCancel - Cancel callback
 * @param {string} submitLabel - Button label (e.g. "Comment", "Save")
 * @param {boolean} loading - Submitting state
 */
const CommentEditor = ({ initialText = '', onSubmit, onCancel, submitLabel = 'Comment', loading = false }) => {
  const [text, setText] = useState(initialText);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text);
    if (!initialText) {
      setText(''); // clear input if new comment
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1.5 }}>
      <TextField
        fullWidth
        multiline
        rows={2}
        placeholder="Write a comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
        size="small"
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
        {onCancel && (
          <Button size="small" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          size="small"
          disabled={loading || !text.trim()}
        >
          {loading ? 'Posting...' : submitLabel}
        </Button>
      </Box>
    </Box>
  );
};

export default CommentEditor;
