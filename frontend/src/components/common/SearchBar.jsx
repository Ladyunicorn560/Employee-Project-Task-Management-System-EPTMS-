import { useState, useEffect, useRef } from 'react';
import { TextField, InputAdornment, IconButton, Box } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

/**
 * SearchBar
 * Controlled search input with configurable debounce.
 * Calls onChange only after the user stops typing (default 300ms).
 *
 * @param {string} value - Controlled input value
 * @param {function} onChange - Called with debounced value string
 * @param {string} placeholder - Input placeholder text
 * @param {boolean} fullWidth - Stretch to container width (default: false)
 * @param {number} debounceMs - Debounce delay in ms (default: 300)
 * @param {string} size - MUI size prop ('small' | 'medium')
 * @param {object} sx - Additional MUI sx styles
 *
 * Usage:
 *   <SearchBar value={search} onChange={setSearch} placeholder="Search employees..." />
 */
const SearchBar = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  fullWidth = false,
  debounceMs = 300,
  size = 'small',
  sx = {},
}) => {
  const [inputValue, setInputValue] = useState(value);
  const timerRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newVal = e.target.value;
    setInputValue(newVal);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange?.(newVal);
    }, debounceMs);
  };

  const handleClear = () => {
    setInputValue('');
    if (timerRef.current) clearTimeout(timerRef.current);
    onChange?.('');
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <Box sx={{ width: fullWidth ? '100%' : 280, ...sx }}>
      <TextField
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        size={size}
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon
                  sx={{ fontSize: 18, color: inputValue ? 'primary.main' : 'text.disabled' }}
                />
              </InputAdornment>
            ),
            endAdornment: inputValue ? (
              <InputAdornment position="end">
                <IconButton onClick={handleClear} size="small" edge="end">
                  <CloseRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2.5,
            backgroundColor: 'background.paper',
          },
          ...sx,
        }}
      />
    </Box>
  );
};

export default SearchBar;
