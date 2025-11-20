import React from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface FindTargetButtonProps {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}

export const FindTargetButton: React.FC<FindTargetButtonProps> = ({
  loading,
  disabled,
  onClick,
}) => {
  return (
    <div className="pt-4 flex justify-center">
      <Button
        size="lg"
        onClick={onClick}
        disabled={disabled}
        className="px-12 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
      >
        <Search className="mr-2 h-5 w-5" />
        {loading ? 'Searching for Target Sites...' : 'Find Target Sites'}
      </Button>
    </div>
  );
};
