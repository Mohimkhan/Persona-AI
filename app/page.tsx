"use client";

import { useEffect } from "react";
import { showToast } from "@/lib/utils/toast";

export default function Home() {
  useEffect(() => {
    showToast({
      message: "Welcome to Next Template",
      type: "success",
    });
  }, []);
  return <div>Your Next Template</div>;
}
