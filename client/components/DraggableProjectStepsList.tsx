import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { EnhancedProjectStepItem } from "./EnhancedProjectStepItem";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

interface DraggableProjectStepsListProps {
  projectId: number;
  steps: any[];
  expandedSteps: { [key: number]: boolean };
  onToggleExpansion: (stepId: number) => void;
  onUpdateStepStatus: (stepId: number, status: string) => void;
}

export function DraggableProjectStepsList({
  projectId,
  steps,
  expandedSteps,
  onToggleExpansion,
  onUpdateStepStatus,
}: DraggableProjectStepsListProps) {
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [items, setItems] = useState(steps);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
        tolerance: 0,
        delay: 150,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  React.useEffect(() => {
    setItems(steps);
  }, [steps]);

  const reorderStepsMutation = useMutation({
    mutationFn: async (stepOrders: { id: number; order: number }[]) => {
      // API call to reorder project steps
      return await apiClient.reorderProjectSteps(projectId, stepOrders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workflow-project-details", projectId],
      });
    },
  });

  function handleDragStart(event: any) {
    const { active } = event;
    setActiveId(active.id);
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);

      // Update step orders
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        step_order: index + 1,
      }));

      setItems(updatedItems);

      // Call API to persist the new order
      const stepOrders = updatedItems.map((item, index) => ({
        id: item.id,
        order: index + 1,
      }));

      reorderStepsMutation.mutate(stepOrders);
    }

    setActiveId(null);
  }

  const activeStep = activeId
    ? items.find((item) => item.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {items.map((step) => (
            <EnhancedProjectStepItem
              key={step.id}
              step={step}
              projectId={projectId}
              isExpanded={expandedSteps[step.id] || false}
              onToggleExpansion={() => onToggleExpansion(step.id)}
              onUpdateStatus={onUpdateStepStatus}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeStep ? (
          <EnhancedProjectStepItem
            step={activeStep}
            projectId={projectId}
            isExpanded={expandedSteps[activeStep.id] || false}
            onToggleExpansion={() => {}}
            onUpdateStatus={() => {}}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
