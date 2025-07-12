export default function FeatureUnavailable() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-4">
      <h1 className="text-4xl font-bold text-red-600 mb-4">
        Feature Not Available
      </h1>
      <p className="text-lg text-gray-600">
        This feature is currently under development or not accessible at this time.
      </p>
    </main>
  );
}
