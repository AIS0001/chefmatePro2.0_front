import React from "react";



const SubmitButtons = ({ name, type, cls }) => {
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
export {SubmitButtons }

