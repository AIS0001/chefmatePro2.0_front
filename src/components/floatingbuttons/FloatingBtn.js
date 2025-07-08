import React from 'react';
import { FloatingActionButton } from 'react-floating-action-button';


export  const  FloatingBtn=()=> {
  return( 
    <FloatingActionButton
      icon={<i className="fa fa-plus"></i>}
      tooltip="Add"
      onClick={() => alert('Button clicked')}
    />
    );
  
}


