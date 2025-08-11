import React from 'react';
import { Outlet } from 'react-router-dom';
import HeaderNav from './HeaderNav';
import ScrollToTop from '../../ScrollToTop';

export default function MainLayout() {
  return (
    <>
      <ScrollToTop />
      <HeaderNav />
      <Outlet />
    </>
  );
}
