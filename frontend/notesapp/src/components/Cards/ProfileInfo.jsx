import React from 'react'
import { getInitials } from '../../utils/helper'
import { useLocation } from 'react-router-dom';

const ProfileInfo = ({ userInfo, onLogout }) => {

  const location = useLocation();

  if (!userInfo || !userInfo.fullname) {
    if(location.pathname === '/dashboard'){
      return <p>Loading...</p>;
    }
    return null;
  }

  return (    
    <div className='flex items-center gap-3 '>
      <div className='w-12 h-12 flex items-center justify-center rounded-full text-slate-950 font-medium bg-slate-100'>
        {getInitials(userInfo.fullname)}
      </div>

      <div>
        <p className='text-sm font-medium'>{userInfo.fullname}</p>
        <button className='text-sm text-slate-700 underline ' onClick={onLogout}>Logout</button>
      </div>
    </div>
  )
}

export default ProfileInfo;