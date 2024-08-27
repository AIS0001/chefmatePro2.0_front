import React from 'react';
import { FloatingActionButton } from 'react-floating-action-button';


const  FloatingActionButtons=()=> {
  return (
    <div>
      {/* Your content */}
      <FloatingActionButton
        icon={<i className="fa fa-plus"></i>}
        tooltip="Add"
        onClick={() => alert('Button clicked')}
      />
    </div>
  );
}

export default FloatingActionButtons;
