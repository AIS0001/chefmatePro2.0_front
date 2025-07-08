import React from 'react';
import FloatingButton from 'react-floating-button';
import 'react-floating-button/dist/styles.css';

function Floatingbutton() {
  return (
    <div>
      {/* Your content */}
      <FloatingButton
        icon={<i className="fa fa-plus"></i>}
        onClick={() => alert('Button clicked')}
      />
    </div>
  );
}

export default Floatingbutton;
