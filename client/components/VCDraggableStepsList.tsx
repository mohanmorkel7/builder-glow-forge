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
import { VCEnhancedStepItem } from "./VCEnhancedStepItem";
import { useReorderVCSteps, useUpdateVCStep } from "@/hooks/useApi";

interface VCDraggableStepsListProps {
  vcId: number;
  steps: any[];
  expandedSteps?: Set<number>;
  onToggleExpansion: (stepId: number) => void;
  onDeleteStep: (stepId: number) => void;
  onReorderSteps: (steps: any[]) => void;
}

export function VCDraggableStepsList({
  vcId,
  steps,
  expandedSteps,
  onToggleExpansion,
  onDeleteStep,
  onReorderSteps,
}: VCDraggableStepsListProps) {
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [items, setItems] = useState(steps);
  const reorderMutation = useReorderVCSteps();
  const updateStepMutation = useUpdateVCStep();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  React.useEffect(() => {
    console.log(
      "VCDraggableStepsList received steps:",
      steps.map((s) => ({ id: s.id, name: s.name })),
    );

    // Deduplicate steps by ID to prevent React key conflicts
    const uniqueSteps = steps.filter(
      (step, index, self) => index === self.findIndex((s) => s.id === step.id),
    );

    if (uniqueSteps.length !== steps.length) {
      console.warn(
        `Removed ${steps.length - uniqueSteps.length} duplicate steps`,
      );
      console.warn("Original steps:", steps);
      console.warn("Unique steps:", uniqueSteps);
    }

    // Additional validation
    const idCounts = {};
    steps.forEach((step) => {
      idCounts[step.id] = (idCounts[step.id] || 0) + 1;
    });

    Object.entries(idCounts).forEach(([id, count]) => {
      if (count > 1) {
        console.error(`Step ID ${id} appears ${count} times`);
      }
    });

    setItems(uniqueSteps);
  }, [steps]);

  const handleUpdateStatus = (stepId: number, status: string) => {
    const step = items.find((item) => item.id === stepId);
    if (!step) {
      console.error("Step not found:", stepId);
      return;
    }

    // Don't allow status updates on template steps
    if (step.isTemplate) {
      console.warn("Cannot update status on template step:", stepId);
      alert(
        "This is a template step. Create a VC-specific step to track progress.",
      );
      return;
    }

    console.log(`Updating VC step ${stepId} status to ${status}`);

    // Optimistically update local state
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === stepId
          ? {
              ...item,
              status,
              completed_date:
                status === "completed" ? new Date().toISOString() : null,
            }
          : item,
      ),
    );

    // Update via API
    updateStepMutation.mutate({
      stepId,
      stepData: {
        status,
        completed_date:
          status === "completed" ? new Date().toISOString() : null,
      },
    });
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update order via API
        const stepOrders = newItems.map((item, index) => ({
          id: item.id,
          order_index: index,
        }));

        reorderMutation.mutate({ vcId, stepOrders });
        onReorderSteps(newItems);

        return newItems;
      });
    }

    setActiveId(null);
  };

  const activeItem = activeId
    ? items.find((item) => item.id === activeId)
    : null;

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">
          <div className="text-sm">No steps available</div>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.map((step) => (
            <VCEnhancedStepItem
              key={step.id}
              step={step}
              vcId={vcId}
              isExpanded={expandedSteps?.has(step.id) || false}
              onToggleExpansion={() => onToggleExpansion(step.id)}
              onStatusChange={handleUpdateStatus}
              onDelete={() => onDeleteStep(step.id)}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem ? (
          <VCEnhancedStepItem
            step={activeItem}
            vcId={vcId}
            isExpanded={false}
            onToggleExpansion={() => {}}
            onStatusChange={() => {}}
            onDelete={() => {}}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
