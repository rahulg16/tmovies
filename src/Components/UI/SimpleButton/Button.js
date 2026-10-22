import React from 'react'
import './Button.css'

function Button({BtnName}) {

  return (
    <button className='btn' type='button'>{BtnName}</button>
  )
}

export default Button
