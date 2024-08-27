import React from 'react';

const Textfield = ({id,type,name, value,placeholder}) => {

    return (
        <>
                 <div class="form-group">
              
                <input type={type}
                name={name}
                id={id}
                 class="form-control"
                  value={value}
                  placeholder={placeholder}
                  />
                  </div>
    
        </>
    )
}
const TextfieldwithLabel = ({lable, type, value}) => {

    return (
        <>
                 <div class="form-group">
                <label class="control-label mb-10">{lable}</label>
                <input type={type}
                 class="form-control"
                  value={value}/>
                  </div>
    
        </>
    )
}

const SubmitButton = ({name, type }) => {
    return (
        <>
        <div class="form-group">
        <button type={type} class="btn btn-success btn-anim"><i class="icon-rocket"></i><span class="btn-text">{name}</span></button>
	</div>	
             
    
        </>
    )
}

export {

    Textfield,
    TextfieldwithLabel,
    SubmitButton
}
