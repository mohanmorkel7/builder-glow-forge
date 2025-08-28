import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface DeploymentAction {
  type: "start" | "pause" | "resume" | "stop" | "retry" | "rollback";
  deploymentId: string;
  data?: any;
}

export interface DeploymentProgress {
  deploymentId: string;
  progress: number;
  status: string;
  currentStep: string;
  steps: Array<{
    name: string;
    status: "pending" | "in_progress" | "completed" | "failed";
    duration?: string;
    startTime?: string;
    endTime?: string;
  }>;
  logs: string[];
  lastUpdated: string;
}

// Mock API functions - replace with actual API calls
const mockApiCalls = {
  updateDeploymentStatus: async (deploymentId: string, status: string) => {
    console.log(`Updating deployment ${deploymentId} status to: ${status}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true, status };
  },

  performDeploymentAction: async (action: DeploymentAction) => {
    console.log(
      `Performing action: ${action.type} on deployment ${action.deploymentId}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newStatus =
      {
        start: "in_progress",
        pause: "paused",
        resume: "in_progress",
        stop: "stopped",
        retry: "in_progress",
        rollback: "rolling_back",
      }[action.type] || "unknown";

    return { success: true, status: newStatus, action: action.type };
  },

  getDeploymentProgress: async (
    deploymentId: string,
  ): Promise<DeploymentProgress> => {
    const mockProgress: DeploymentProgress = {
      deploymentId,
      progress: 65,
      status: "in_progress",
      currentStep: "Running Integration Tests",
      steps: [
        {
          name: "Build Application",
          status: "completed",
          duration: "2m 15s",
          startTime: "10:30:15",
          endTime: "10:32:30",
        },
        {
          name: "Run Tests",
          status: "completed",
          duration: "5m 30s",
          startTime: "10:32:30",
          endTime: "10:38:00",
        },
        {
          name: "Deploy to Staging",
          status: "completed",
          duration: "1m 45s",
          startTime: "10:38:00",
          endTime: "10:39:45",
        },
        {
          name: "Run Integration Tests",
          status: "in_progress",
          startTime: "10:39:45",
        },
        { name: "Deploy to Production", status: "pending" },
        { name: "Health Check", status: "pending" },
        { name: "Send Notifications", status: "pending" },
      ],
      logs: [
        "10:44:50 INFO: Integration tests in progress (15/23 completed)...",
        "10:44:55 INFO: Running test: User Authentication Flow",
        "10:45:00 INFO: Running test: API Endpoint Validation",
        "10:45:05 INFO: Running test: Database Connection Pool",
      ],
      lastUpdated: new Date().toISOString(),
    };

    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockProgress;
  },
};

export function useDeploymentControl(deploymentId?: string) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<DeploymentProgress | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({
      deploymentId,
      status,
    }: {
      deploymentId: string;
      status: string;
    }) => mockApiCalls.updateDeploymentStatus(deploymentId, status),
    onSuccess: (data, variables) => {
      // Invalidate deployments query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      console.log(
        `Status updated successfully for deployment ${variables.deploymentId}`,
      );
    },
    onError: (error) => {
      console.error("Failed to update deployment status:", error);
    },
  });

  // Action mutation for deployment controls
  const actionMutation = useMutation({
    mutationFn: (action: DeploymentAction) =>
      mockApiCalls.performDeploymentAction(action),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      console.log(`Action ${variables.type} completed successfully`);

      // Start polling if action starts a process
      if (["start", "resume", "retry"].includes(variables.type)) {
        setIsPolling(true);
      } else if (["stop", "pause"].includes(variables.type)) {
        setIsPolling(false);
      }
    },
    onError: (error) => {
      console.error("Failed to perform deployment action:", error);
    },
  });

  // Progress polling function
  const pollProgress = useCallback(async () => {
    if (!deploymentId || !isPolling) return;

    try {
      const progressData =
        await mockApiCalls.getDeploymentProgress(deploymentId);
      setProgress(progressData);

      // Stop polling if deployment is complete or failed
      if (
        ["completed", "failed", "stopped", "paused"].includes(
          progressData.status,
        )
      ) {
        setIsPolling(false);
      }
    } catch (error) {
      console.error("Failed to fetch deployment progress:", error);
    }
  }, [deploymentId, isPolling]);

  // Set up polling interval
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPolling && deploymentId) {
      pollProgress(); // Initial call
      intervalId = setInterval(pollProgress, 3000); // Poll every 3 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPolling, deploymentId, pollProgress]);

  // Helper functions
  const updateStatus = (deploymentId: string, status: string) => {
    statusMutation.mutate({ deploymentId, status });
  };

  const performAction = (action: Omit<DeploymentAction, "deploymentId">) => {
    if (!deploymentId) {
      console.error("No deployment ID provided");
      return;
    }
    actionMutation.mutate({ ...action, deploymentId });
  };

  const startPolling = () => setIsPolling(true);
  const stopPolling = () => setIsPolling(false);

  // Convenience methods for common actions
  const actions = {
    start: (data?: any) => performAction({ type: "start", data }),
    pause: () => performAction({ type: "pause" }),
    resume: () => performAction({ type: "resume" }),
    stop: () => performAction({ type: "stop" }),
    retry: () => performAction({ type: "retry" }),
    rollback: () => performAction({ type: "rollback" }),
  };

  return {
    // Status management
    updateStatus,
    isUpdatingStatus: statusMutation.isPending,
    statusError: statusMutation.error,

    // Action management
    performAction,
    actions,
    isPerformingAction: actionMutation.isPending,
    actionError: actionMutation.error,
    lastActionResult: actionMutation.data,

    // Progress tracking
    progress,
    isPolling,
    startPolling,
    stopPolling,
    refreshProgress: pollProgress,

    // Combined loading state
    isLoading: statusMutation.isPending || actionMutation.isPending,
  };
}

// Real-time deployment status hook
export function useDeploymentStatus(deploymentId: string) {
  const [status, setStatus] = useState<string>("unknown");
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const { progress, isPolling, startPolling } =
    useDeploymentControl(deploymentId);

  useEffect(() => {
    if (progress) {
      setStatus(progress.status);
      setLastUpdate(progress.lastUpdated);
    }
  }, [progress]);

  // Auto-start polling for active deployments
  useEffect(() => {
    if (["in_progress", "pending"].includes(status)) {
      startPolling();
    }
  }, [status, startPolling]);

  return {
    status,
    lastUpdate,
    isLive: isPolling,
    progress: progress?.progress || 0,
    currentStep: progress?.currentStep || "",
    steps: progress?.steps || [],
    logs: progress?.logs || [],
  };
}
