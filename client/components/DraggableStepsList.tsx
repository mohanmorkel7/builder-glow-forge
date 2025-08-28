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
import { useReorderLeadSteps, useUpdateLeadStep } from "@/hooks/useApi";

interface DraggableStepsListProps {
  leadId: number;
  steps: any[];
  expandedSteps?: Set<number>;
  onToggleExpansion: (stepId: number) => void;
  onDeleteStep: (stepId: number) => void;
  onReorderSteps: (steps: any[]) => void;
}

export function DraggableStepsList({
  leadId,
  steps,
  expandedSteps,
  onToggleExpansion,
  onDeleteStep,
  onReorderSteps,
}: DraggableStepsListProps) {
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [items, setItems] = useState(steps);
  const reorderMutation = useReorderLeadSteps();
  const updateStepMutation = useUpdateLeadStep();

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
      "DraggableStepsList received steps:",
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
        "Cannot update status on template steps. Please create actual lead steps first.",
      );
      return;
    }

    const stepData = { status };
    console.log("Updating lead step status:", stepId, "to:", status);
    updateStepMutation.mutate({ stepId, stepData });
  };

  function handleDragStart(event: any) {
    const { active } = event;
    setActiveId(active.id);
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const activeStep = items.find((item) => item.id === active.id);
      const overStep = items.find((item) => item.id === over?.id);

      // Prevent reordering if either step is a template step
      if (activeStep?.isTemplate || overStep?.isTemplate) {
        console.warn("Cannot reorder template steps");
        setActiveId(null);
        return;
      }

      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);

      // Update step orders only for non-template steps
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        step_order: item.isTemplate ? item.step_order : index + 1,
      }));

      setItems(updatedItems);
      onReorderSteps(updatedItems);

      // Call API to persist the new order (only for lead steps)
      const stepOrders = updatedItems
        .filter((item) => !item.isTemplate)
        .map((item, index) => ({
          id: item.id,
          order: index + 1,
        }));

      if (stepOrders.length > 0) {
        reorderMutation.mutate({ leadId, stepOrders });
      }
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
          {items.map((step, index) => (
            <EnhancedStepItem
              key={`${step.id}-${index}`}
              step={step}
              isExpanded={expandedSteps?.has(step.id) || false}
              onToggleExpansion={() => onToggleExpansion(step.id)}
              onUpdateStatus={handleUpdateStatus}
              onDeleteStep={onDeleteStep}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeStep ? (
          <EnhancedStepItem
            step={activeStep}
            isExpanded={expandedSteps?.has(activeStep.id) || false}
            onToggleExpansion={() => {}}
            onUpdateStatus={() => {}}
            onDeleteStep={() => {}}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
