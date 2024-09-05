/* eslint-disable no-undef */

import React, { useState, useEffect } from 'react';
import { fetchComboData } from '../../services/api';

const ComboBox = ({ id,name, onChange,tablename, groupby,value }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {

    try {
      const data = await fetchComboData(tablename, groupby);
      setOptions(data);
    } catch (error) {
      console.error('Error fetching user types:', error);
      setError('An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (event) => {
    const value = event.target.value;
    setSelectedValue(value);


    // Fetch data based on selected value
    try {
      const data = await fetchComboData(tablename, groupby);
      console.log('Fetched data based on selection:', data);
    } catch (error) {
      setError('An error occurred while fetching data.');
    }
  };

  useEffect(() => {

    fetchData();
    $('#action').select2()
  }, [])

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  return (
    <>
      <div className="combo-box-container">
        <div className='combo-box'>
          <select
            id={id}
            name={name}
            className='combo-box-select'
            value={value}
            onChange={onChange}
            data-style='form-control btn-default btn-outline'
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>

            ))}

          </select>
          <div className="combo-box-arrow"></div>
        </div>
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
