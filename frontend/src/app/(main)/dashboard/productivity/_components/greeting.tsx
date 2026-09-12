"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";

export function Greeting() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good afternoon");
    } else if (hour >= 17 && hour < 21) {
      setGreeting("Good evening");
    } else {
      setGreeting("Good night");
    }
  }, []);

  const name = user?.username || "User";

  return <h1 className="text-3xl leading-none tracking-tight">{greeting}, {name}.</h1>;
}
