import CoreSpinLoader from "./components/CoreSpinLoader";

export default function Loading() {
  return (
    <main className="flex min-h-[100dvh] w-full items-center justify-center bg-white">
      <CoreSpinLoader />
    </main>
  );
}