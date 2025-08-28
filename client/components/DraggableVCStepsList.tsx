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
import { EnhancedStepItem } from "./EnhancedStepItem";
import { useReorderVCSteps, useUpdateVCStep } from "@/hooks/useApi";

interface DraggableVCStepsListProps {
  vcId: number;
  steps: any[];
  expandedSteps?: Set<number>;
  onToggleExpansion: (stepId: number) => void;
  onDeleteStep: (stepId: number) => void;
  onReorderSteps: (steps: any[]) => void;
}

export function DraggableVCStepsList({
  vcId,
  steps,
  expandedSteps,
  onToggleExpansion,
  onDeleteStep,
  onReorderSteps,
}: DraggableVCStepsListProps) {
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
      "DraggableVCStepsList received steps:",
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
    }

    setItems(uniqueSteps);
  }, [steps]);

  function handleDragStart(event: any) {
    const { active } = event;
    setActiveId(active.id);
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Call the parent's reorder function
        onReorderSteps(newItems);

        return newItems;
      });
    }

    setActiveId(null);
  }

  const handleUpdateStatus = (stepId: number, status: string) => {
    const step = items.find((item) => item.id === stepId);
    if (!step) {
      console.error("VC Step not found:", stepId);
      return;
    }

    // Don't allow status updates on template steps
    if (step.isTemplate) {
      console.warn("Cannot update status on template step:", stepId);
      alert(
        "Cannot update status on template steps. Please create actual VC steps first.",
      );
      return;
    }

    const stepData = { status };
    console.log("Updating VC step status:", stepId, "to:", status);
    updateStepMutation.mutate({ stepId, stepData });
  };

  const activeStep = activeId
    ? items.find((item) => item.id === activeId)
    : null;

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <div className="mb-3">
          <svg
            className="w-12 h-12 mx-auto text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p>No funding steps yet</p>
        <p className="text-sm">Add your first step to get started</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((step, index) => (
            <EnhancedStepItem
              key={step.id}
              step={step}
              isExpanded={expandedSteps?.has(step.id) || false}
              onToggleExpansion={() => onToggleExpansion(step.id)}
              onUpdateStatus={handleUpdateStatus}
              onDeleteStep={() => onDeleteStep(step.id)}
              isVC={true}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeStep ? (
          <EnhancedStepItem
            step={activeStep}
            isExpanded={false}
            onToggleExpansion={() => {}}
            onUpdateStatus={() => {}}
            onDeleteStep={() => {}}
            isVC={true}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
