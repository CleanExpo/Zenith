import React from 'react';
import { Button } from 'react-bootstrap';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  icon,
  children,
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center"
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : icon}
      {children}
    </Button>
  );
};

export default LoadingButton;
