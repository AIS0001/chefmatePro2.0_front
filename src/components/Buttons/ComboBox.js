/* eslint-disable no-undef */

import React, { useEffect } from 'react'

const ComboBox = ({ id, combodata }) => {
  useEffect(() => {
    $('#action').select2()
  }, [])
  return (
    <>
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
      </div>
    </>
  )
}

const ComboBoxwithlabel = ({ lable, id, combodata }) => {
  useEffect(() => {
    $('#action').select2()
  }, [])
  return (
    <>
      <div class='form-group'>
        <label class='control-label mb-10'>{lable}</label>
        <select
          id={id}
          class='selectpicker'
          data-style='form-control btn-default btn-outline'
        >
          {combodata && <option value={combodata}>{combodata}</option>}
          <option>Publish</option>
          <option>Hold</option>
        </select>
      </div>
    </>
  )
}

export { ComboBox, ComboBoxwithlabel }
