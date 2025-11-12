import React from 'react';
import RoomVibe from '../widget/RoomVibe';

const DemoApp: React.FC = () => {
  return (
    <RoomVibe
      mode="showcase"
      collection="all"
      theme="azure"
      oneClickBuy={true}
      checkoutType="shopify"
      onEvent={(event) => {
        console.log('RoomVibe Event:', event);
      }}
    />
  );
};

export default DemoApp;
