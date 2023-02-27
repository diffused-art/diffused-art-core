import React, { useState, useEffect } from 'react';

const DefaultOnSSR = () => (<span></span>);

const NoSSR = ({ children, onSSR = <DefaultOnSSR /> }) => {
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    setCanRender(true);
  }, []);

  return canRender ? children : onSSR;
};

export default NoSSR;
