/* eslint-disable no-undef */
import React, { useEffect } from 'react';

function SummernoteEditor({id}) {
    useEffect(() => {
      // Initialize Summernote on component mount
      $('#summernote').summernote({
        height: 300,                 // set editor height
        minHeight: null,             // set minimum height of editor
        maxHeight: null,             // set maximum height of editor
        focus: true                  // set focus to editable area after initializing summernote
      });
  
      // Cleanup function to destroy Summernote when the component unmounts
      return () => {
        $('#summernote').summernote('destroy');
      };
    }, []);
  
    return (
      <div>
     
        <div id={id}></div>
      </div>
    );
  }
  
  export default SummernoteEditor;
  