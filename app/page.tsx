'use client'

import { RateLimiter } from "./challenges/RateLimiter";

export default function Home() {

  return (
    <div>
      Challenge Accepted!
      <RateLimiter />
    </div>
  );
}
