import React from 'react'
import { Outlet } from 'react-router'

function AuthLayout() {
  return (
    <div className='min-w-dvw min-h-dvh flex justify-center items-center'>
        <Outlet />
    </div>
  )
}

export default AuthLayout