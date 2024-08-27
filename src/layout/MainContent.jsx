import React from 'react'


export default function MainContent({ children }) {
  return (
    <>
      <div class="page-wrapper">
        <div class="container-fluid">

          {children}

        </div>
      </div>
    </>
  )
}
