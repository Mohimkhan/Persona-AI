"use client";

import { useTheme } from "next-themes";
import { ToastContainer, Bounce } from "react-toastify";

const CustomToastContainer = () => {
  const { resolvedTheme } = useTheme();

  return (
    <ToastContainer
      position="bottom-right"
      limit={3}
      transition={Bounce}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      pauseOnHover
      pauseOnFocusLoss={false}
      newestOnTop={true}
      closeOnClick
      autoClose={3000}
      style={{ zIndex: 1000 }}
    />
  );
};

export default CustomToastContainer;
