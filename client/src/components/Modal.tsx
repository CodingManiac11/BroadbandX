import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth={size}
      fullWidth
      aria-labelledby="modal-title"
    >
      {title && (
        <DialogTitle id="modal-title">
          {title}
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      )}
      {children}
    </Dialog>
  );
};

export const ModalBody: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <DialogContent>{children}</DialogContent>
);

export const ModalHeader: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <DialogTitle>{children}</DialogTitle>
);

export const ModalFooter: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <DialogActions>{children}</DialogActions>
);

export default Modal;