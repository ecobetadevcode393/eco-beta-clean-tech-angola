'use client';

import { SylvaHero } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";

export function Scene() {
  return (
    <div className="shader-frame w-full h-full">
      <SylvaHero
        variant="living-green"
      />
    </div>
  );
}
