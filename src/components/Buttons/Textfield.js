import React from 'react'

const Textfield = ({ id, type, name, value, placeholder }) => {
  return (
    <>
      <div className='form-group'>
        <input
          type={type}
          name={name}
          id={id}
          className='form-control'
          value={value}
          placeholder={placeholder}
        />
      </div>
    </>
  )
}
const TextfieldwithLabel = ({ lable, type, id, name, value }) => {
  return (
    <>
      <div className='form-group'>
        <label className='control-label mb-10'>{lable}</label>
        <input
          type={type}
          className='form-control'
          id={id}
          name={name}
          value={value}
        />
      </div>
    </>
  )
}
const SubmitButton = ({ name, type, cls }) => {
  return (
      <>
          <div className='form-group'>
              <button type={type} className={cls}>
                  <i className='icon-rocket'></i>
                  <span className='btn-text'>{name}</span>
              </button>
          </div>
      </>
  )
}


export { Textfield, TextfieldwithLabel,SubmitButton }
