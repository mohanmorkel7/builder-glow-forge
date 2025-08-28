import { Router, Request, Response } from "express";
import {
  DeploymentRepository,
  ProductRepository,
  CreateDeploymentData,
  UpdateDeploymentData,
} from "../models/Deployment";
import { MockDataService } from "../services/mockData";

const router = Router();

// Helper function to check if database is available
async function isDatabaseAvailable() {
  try {
    await DeploymentRepository.findAll();
    return true;
  } catch (error) {
    return false;
  }
}

// Get all deployments
router.get("/", async (req: Request, res: Response) => {
  try {
    const { assignee } = req.query;

    let deployments;
    if (await isDatabaseAvailable()) {
      if (assignee) {
        const assigneeId = parseInt(assignee as string);
        if (isNaN(assigneeId)) {
          return res.status(400).json({ error: "Invalid assignee ID" });
        }
        deployments = await DeploymentRepository.findByAssignee(assigneeId);
      } else {
        deployments = await DeploymentRepository.findAll();
      }
    } else {
      deployments = await MockDataService.getAllDeployments();
      if (assignee) {
        const assigneeId = parseInt(assignee as string);
        deployments = deployments.filter((d) => d.assigned_to === assigneeId);
      }
    }

    res.json(deployments);
  } catch (error) {
    console.error("Error fetching deployments:", error);
    // Fallback to mock data
    const deployments = await MockDataService.getAllDeployments();
    res.json(deployments);
  }
});

// Get deployment statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    let stats;
    if (await isDatabaseAvailable()) {
      stats = await DeploymentRepository.getStats();
    } else {
      stats = await MockDataService.getDeploymentStats();
    }
    res.json(stats);
  } catch (error) {
    console.error("Error fetching deployment stats:", error);
    // Fallback to mock data
    try {
      const stats = await MockDataService.getDeploymentStats();
      res.json(stats);
    } catch (fallbackError) {
      res.status(500).json({ error: "Failed to fetch deployment statistics" });
    }
  }
});

// Get deployment by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid deployment ID" });
    }

    const deployment = await DeploymentRepository.findById(id);
    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    res.json(deployment);
  } catch (error) {
    console.error("Error fetching deployment:", error);
    res.status(500).json({ error: "Failed to fetch deployment" });
  }
});

// Create new deployment
router.post("/", async (req: Request, res: Response) => {
  try {
    const deploymentData: CreateDeploymentData = req.body;

    // Validate required fields
    if (
      !deploymentData.product_id ||
      !deploymentData.version ||
      !deploymentData.environment ||
      !deploymentData.created_by
    ) {
      return res
        .status(400)
        .json({
          error:
            "Missing required fields: product_id, version, environment, created_by",
        });
    }

    // Validate environment
    if (
      !["development", "staging", "qa", "production"].includes(
        deploymentData.environment,
      )
    ) {
      return res.status(400).json({ error: "Invalid environment value" });
    }

    // Verify product exists
    const product = await ProductRepository.findById(deploymentData.product_id);
    if (!product) {
      return res.status(400).json({ error: "Product not found" });
    }

    const deployment = await DeploymentRepository.create(deploymentData);
    res.status(201).json(deployment);
  } catch (error) {
    console.error("Error creating deployment:", error);
    res.status(500).json({ error: "Failed to create deployment" });
  }
});

// Update deployment
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid deployment ID" });
    }

    const deploymentData: UpdateDeploymentData = req.body;

    // Validate environment if provided
    if (
      deploymentData.environment &&
      !["development", "staging", "qa", "production"].includes(
        deploymentData.environment,
      )
    ) {
      return res.status(400).json({ error: "Invalid environment value" });
    }

    // Validate status if provided
    if (
      deploymentData.status &&
      ![
        "pending",
        "scheduled",
        "in_progress",
        "completed",
        "failed",
        "cancelled",
      ].includes(deploymentData.status)
    ) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const deployment = await DeploymentRepository.update(id, deploymentData);
    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    res.json(deployment);
  } catch (error) {
    console.error("Error updating deployment:", error);
    res.status(500).json({ error: "Failed to update deployment" });
  }
});

// Update deployment status
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid deployment ID" });
    }

    const { status } = req.body;
    if (
      !status ||
      ![
        "pending",
        "scheduled",
        "in_progress",
        "completed",
        "failed",
        "cancelled",
      ].includes(status)
    ) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const deployment = await DeploymentRepository.updateStatus(id, status);
    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    res.json(deployment);
  } catch (error) {
    console.error("Error updating deployment status:", error);
    res.status(500).json({ error: "Failed to update deployment status" });
  }
});

// Delete deployment
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid deployment ID" });
    }

    const success = await DeploymentRepository.delete(id);
    if (!success) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting deployment:", error);
    res.status(500).json({ error: "Failed to delete deployment" });
  }
});

// Get all products
router.get("/products/list", async (req: Request, res: Response) => {
  try {
    let products;
    if (await isDatabaseAvailable()) {
      products = await ProductRepository.findAll();
    } else {
      products = await MockDataService.getAllProducts();
    }
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    // Fallback to mock data
    const products = await MockDataService.getAllProducts();
    res.json(products);
  }
});

export default router;
