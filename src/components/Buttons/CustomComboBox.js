import React, { useState, useRef, useEffect } from 'react';

const CustomComboBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');
  const [selectedText, setSelectedText] = useState('Select an option');
  const dropdownRef = useRef(null);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleOptionClick = (value, text) => {
    setSelectedValue(value);
    setSelectedText(text);
    setIsOpen(false);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="custom-select-wrapper" ref={dropdownRef}>
      <div className="custom-select" onClick={handleToggle}>
        <span className="select-selected">{selectedText}</span>
        <span className={`select-arrow ${isOpen ? 'open' : ''}`}>&#9660;</span>
      </div>
      {isOpen && (
        <div className="custom-options">
          <div className="custom-option" onClick={() => handleOptionClick('1', 'Option 1')}>Option 1</div>
          <div className="custom-option" onClick={() => handleOptionClick('2', 'Option 2')}>Option 2</div>
          <div className="custom-option" onClick={() => handleOptionClick('3', 'Option 3')}>Option 3</div>
          <div className="custom-option" onClick={() => handleOptionClick('4', 'Option 4')}>Option 4</div>
        </div>
      )}
    </div>
  );
};

export default CustomComboBox;
