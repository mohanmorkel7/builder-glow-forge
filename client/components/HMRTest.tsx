import React from "react";

// Test component to verify HMR fixes work correctly
export function HMRTest() {
  const [counter, setCounter] = React.useState(0);

  // Safe HMR handling
  React.useEffect(() => {
    if (import.meta.hot) {
      import.meta.hot.accept(() => {
        console.log("HMR Test: Component updated safely");
      });
    }
  }, []);

  return (
    <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
      <h3 className="text-lg font-semibold text-green-800">
        HMR Test Component
      </h3>
      <p className="text-green-700">
        This component tests that HMR is working without connection errors.
      </p>
      <p className="text-green-600">Counter: {counter}</p>
      <button
        onClick={() => setCounter((c) => c + 1)}
        className="mt-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Increment
      </button>
      <p className="text-xs text-green-500 mt-2">
        Try editing this component - HMR should work without "send was called
        before connect" errors
      </p>
    </div>
  );
}
