"use client";

import { useTheme } from "next-themes";
import { ToastContainer, Bounce } from "react-toastify";

const CustomToastContainer = () => {
  const { theme } = useTheme();

  return (
    <ToastContainer
      position="bottom-right"
      limit={3}
      transition={Bounce}
      theme={theme}
      pauseOnHover
      pauseOnFocusLoss={false}
      newestOnTop={true}
      closeOnClick
      autoClose={false}
      style={{ zIndex: 1000 }}
    />
  );
};

export default CustomToastContainer;
