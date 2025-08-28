import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { apiClient } from "@/lib/api";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Check offline status every 5 seconds
    const checkStatus = () => {
      setIsOffline(apiClient.isOffline());
    };

    checkStatus(); // Initial check
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Reset circuit breaker and try a simple request
      apiClient.resetCircuitBreaker();
      await apiClient.request("/users");
      setIsOffline(false);
    } catch (error) {
      console.log("Retry failed, server still offline");
    } finally {
      setIsRetrying(false);
    }
  };

  if (!isOffline) {
    return null;
  }

  return (
    <Alert className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md border-orange-200 bg-orange-50">
      <WifiOff className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <span className="font-medium text-orange-800">Backend Offline</span>
          <p className="text-sm text-orange-700 mt-1">
            Showing cached data. Features may be limited.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRetry}
          disabled={isRetrying}
          className="ml-2 border-orange-300 text-orange-700 hover:bg-orange-100"
        >
          {isRetrying ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Wifi className="h-3 w-3" />
          )}
          <span className="ml-1 text-xs">
            {isRetrying ? "Retrying..." : "Retry"}
          </span>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
