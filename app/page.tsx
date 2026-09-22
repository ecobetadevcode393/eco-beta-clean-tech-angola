import { Scene } from "@/components/Scene";
import { MyEcobetaAuth } from "@/components/MyEcobetaAuth";

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#4a4d44]">
      <Scene />
      {/* The hero frame's myEcobetaApp pill asks for this overlay over postMessage. */}
      <MyEcobetaAuth />
    </main>
  );
}
