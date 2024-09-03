import React from 'react'

import Footer from "./Footer";
import WhatsAppButton from '../components/floatingbuttons/Whatsappbutton';
import PhoneButton from '../components/floatingbuttons/PhoneButton';

export default function MainContent({ children }) {
  return (
    <>
      <div class="page-wrapper">
        <div class="container-fluid">

          {children}

        </div>
        <WhatsAppButton phoneNumber="66986643299" />
        <PhoneButton phoneNumber="66986643299" />
        <Footer />
      </div>
    </>
  )
}
