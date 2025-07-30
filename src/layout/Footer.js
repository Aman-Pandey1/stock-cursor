import React from 'react';
import { Box, Typography } from '@mui/material';
import '../styles/layout.css';

const Footer = () => {
  return (
    <Box className="app-footer">
      <Typography variant="body2" color="textSecondary" align="center">
        © {new Date().getFullYear()} Tiles Admin Panel
      </Typography>
    </Box>
  );
};

export default Footer;