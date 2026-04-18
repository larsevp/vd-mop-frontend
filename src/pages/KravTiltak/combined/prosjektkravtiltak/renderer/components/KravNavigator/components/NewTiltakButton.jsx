import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/primitives/button';

const NewTiltakButton = ({ currentKravId, onCreateTiltak }) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onCreateTiltak(currentKravId)}
      className="text-slate-500 hover:text-slate-700 border-dashed"
    >
      <Plus className="w-4 h-4 mr-1.5" />
      Nytt tiltak
    </Button>
  );
};

export default NewTiltakButton;
