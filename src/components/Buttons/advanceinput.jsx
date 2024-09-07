/* eslint-disable no-undef */
import React, { useEffect } from 'react'


const AdvanceInput = ({  onChange,  id, type, name, value,label}) => {
  return (
    <>
     <div className="container">
    <div className="input-group">
      <input type={type}
          name={name}
          id={id} 
          
          value={value}
          onChange={onChange}
          // Spread any additional props passed to the input
          placeholder=" "/>
      <label for="modern-input">{label}</label>
      <span className="highlight"></span>
      <span className="bar"></span>
    </div>
  </div>

    </>
  )
}

const AdvanceComboBox = ({ id, combodata }) => {
    useEffect(() => {
      $('#action').select2()
    }, [])
    return (
      <>
        <div class="custom-select-wrapper">
      <select id="custom-combo-box">
        <option value="" disabled selected>Select an option</option>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
        <option value="4">Option 4</option>
      </select>
      <div class="custom-select">
        <span class="select-selected">Select an option</span>
        <span class="select-arrow">&#9660;</span>
      </div>
    </div>

        <div class='form-group'>
          <select
            id={id}
            class='selectpicker'
            data-style='form-control btn-default btn-outline'
          >
            {combodata && <option value={combodata}>{combodata}</option>}
            <option>Publish</option>
            <option>Hold</option>
            <option>Draft</option>
          </select>
          <div class="custom-select">
        <span class="select-selected">Select an option</span>
        <span class="select-arrow">&#9660;</span>
      </div>
        </div>
      </>
    )
  }
export { AdvanceInput,AdvanceComboBox}
