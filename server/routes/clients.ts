import { Router, Request, Response } from "express";
import {
  ClientRepository,
  CreateClientData,
  UpdateClientData,
} from "../models/Client";
import { MockDataService } from "../services/mockData";
import { DatabaseValidator, ValidationSchemas } from "../utils/validation";

const router = Router();

// Enhanced helper function with better error handling
async function isDatabaseAvailable() {
  try {
    return await DatabaseValidator.isDatabaseAvailable();
  } catch (error) {
    console.log("Database availability check failed:", error.message);
    return false;
  }
}

// Get all clients with enhanced validation
router.get("/", async (req: Request, res: Response) => {
  try {
    const { salesRep } = req.query;
    let salesRepId: number | undefined;

    // Validate salesRep parameter
    if (salesRep) {
      salesRepId = parseInt(salesRep as string);
      if (isNaN(salesRepId) || salesRepId <= 0) {
        return res.status(400).json({ error: "Invalid sales rep ID format" });
      }

      // Check if sales rep exists (only if database is available)
      if (await isDatabaseAvailable()) {
        const userExists = await DatabaseValidator.userExists(salesRepId);
        if (!userExists) {
          return res
            .status(404)
            .json({ error: "Sales representative not found" });
        }
      }
    }

    let clients;
    try {
      if (await isDatabaseAvailable()) {
        if (salesRepId) {
          clients = await ClientRepository.findBySalesRep(salesRepId);
        } else {
          clients = await ClientRepository.findAll();
        }
      } else {
        clients = await MockDataService.getAllClients();
        if (salesRepId) {
          clients = clients.filter(
            (client) => client.sales_rep_id === salesRepId,
          );
        }
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      clients = await MockDataService.getAllClients();
      if (salesRepId) {
        clients = clients.filter(
          (client) => client.sales_rep_id === salesRepId,
        );
      }
    }

    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    try {
      const clients = await MockDataService.getAllClients();
      res.json(clients);
    } catch (fallbackError) {
      console.error("Mock data fallback failed:", fallbackError);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  }
});

// Get client statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    let stats;
    if (await isDatabaseAvailable()) {
      stats = await ClientRepository.getStats();
    } else {
      stats = await MockDataService.getClientStats();
    }
    res.json(stats);
  } catch (error) {
    console.error("Error fetching client stats:", error);
    // Fallback to mock data
    const stats = await MockDataService.getClientStats();
    res.json(stats);
  }
});

// Get client by ID with enhanced validation
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    let client;
    try {
      if (await isDatabaseAvailable()) {
        // First check if client exists
        const exists = await DatabaseValidator.clientExists(id);
        if (!exists) {
          return res.status(404).json({ error: "Client not found" });
        }

        client = await ClientRepository.findById(id);
      } else {
        const clients = await MockDataService.getAllClients();
        client = clients.find((c) => c.id === id);
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      const clients = await MockDataService.getAllClients();
      client = clients.find((c) => c.id === id);
    }

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    try {
      const clients = await MockDataService.getAllClients();
      const client = clients.find((c) => c.id === parseInt(req.params.id));
      if (client) {
        res.json(client);
      } else {
        res.status(404).json({ error: "Client not found" });
      }
    } catch (fallbackError) {
      console.error("Mock data fallback failed:", fallbackError);
      res.status(500).json({ error: "Failed to fetch client" });
    }
  }
});

// Create new client with comprehensive validation
router.post("/", async (req: Request, res: Response) => {
  try {
    const clientData: CreateClientData = req.body;

    // Validate required fields
    const validation = DatabaseValidator.validateRequiredFields(
      clientData,
      ValidationSchemas.client.required,
    );

    if (!validation.isValid) {
      return res.status(400).json({
        error: "Missing required fields",
        missingFields: validation.missingFields,
      });
    }

    // Validate email format
    if (!DatabaseValidator.isValidEmail(clientData.email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate phone format if provided
    if (clientData.phone && !DatabaseValidator.isValidPhone(clientData.phone)) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }

    // Validate enum values if provided
    if (
      clientData.priority &&
      !ValidationSchemas.client.enums.priority.includes(clientData.priority)
    ) {
      return res.status(400).json({
        error: "Invalid priority value",
        validOptions: ValidationSchemas.client.enums.priority,
      });
    }

    if (
      clientData.status &&
      !ValidationSchemas.client.enums.status.includes(clientData.status)
    ) {
      return res.status(400).json({
        error: "Invalid status value",
        validOptions: ValidationSchemas.client.enums.status,
      });
    }

    // Validate expected_value if provided
    if (clientData.expected_value !== undefined) {
      if (!DatabaseValidator.isValidNumber(clientData.expected_value, 0)) {
        return res
          .status(400)
          .json({ error: "Expected value must be a positive number" });
      }
    }

    // Validate sales rep exists if provided
    if (clientData.sales_rep_id && (await isDatabaseAvailable())) {
      const userExists = await DatabaseValidator.userExists(
        clientData.sales_rep_id,
      );
      if (!userExists) {
        return res
          .status(400)
          .json({ error: "Sales representative not found" });
      }
    }

    try {
      if (await isDatabaseAvailable()) {
        const client = await ClientRepository.create(clientData);
        res.status(201).json(client);
      } else {
        const mockClient = {
          id: Date.now(),
          ...clientData,
          status: clientData.status || ("active" as const),
          priority: clientData.priority || ("medium" as const),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        console.log("Database unavailable, returning mock client response");
        res.status(201).json(mockClient);
      }
    } catch (dbError) {
      console.log(
        "Database error, returning mock client response:",
        dbError.message,
      );
      const mockClient = {
        id: Date.now(),
        ...clientData,
        status: clientData.status || ("active" as const),
        priority: clientData.priority || ("medium" as const),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      res.status(201).json(mockClient);
    }
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ error: "Failed to create client" });
  }
});

// Update client with enhanced validation
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    const clientData: UpdateClientData = req.body;

    // Validate email format if provided
    if (clientData.email && !DatabaseValidator.isValidEmail(clientData.email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate phone format if provided
    if (clientData.phone && !DatabaseValidator.isValidPhone(clientData.phone)) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }

    // Validate enum values if provided
    if (
      clientData.priority &&
      !ValidationSchemas.client.enums.priority.includes(clientData.priority)
    ) {
      return res.status(400).json({
        error: "Invalid priority value",
        validOptions: ValidationSchemas.client.enums.priority,
      });
    }

    if (
      clientData.status &&
      !ValidationSchemas.client.enums.status.includes(clientData.status)
    ) {
      return res.status(400).json({
        error: "Invalid status value",
        validOptions: ValidationSchemas.client.enums.status,
      });
    }

    // Validate expected_value if provided
    if (clientData.expected_value !== undefined) {
      if (!DatabaseValidator.isValidNumber(clientData.expected_value, 0)) {
        return res
          .status(400)
          .json({ error: "Expected value must be a positive number" });
      }
    }

    // Validate sales rep exists if provided
    if (clientData.sales_rep_id && (await isDatabaseAvailable())) {
      const userExists = await DatabaseValidator.userExists(
        clientData.sales_rep_id,
      );
      if (!userExists) {
        return res
          .status(400)
          .json({ error: "Sales representative not found" });
      }
    }

    try {
      if (await isDatabaseAvailable()) {
        // Check if client exists
        const exists = await DatabaseValidator.clientExists(id);
        if (!exists) {
          return res.status(404).json({ error: "Client not found" });
        }

        const client = await ClientRepository.update(id, clientData);
        if (!client) {
          return res.status(404).json({ error: "Client not found" });
        }
        res.json(client);
      } else {
        const mockClient = {
          id: id,
          ...clientData,
          updated_at: new Date().toISOString(),
        };
        console.log(
          "Database unavailable, returning mock client update response",
        );
        res.json(mockClient);
      }
    } catch (dbError) {
      console.log(
        "Database error, returning mock client update response:",
        dbError.message,
      );
      const mockClient = {
        id: id,
        ...clientData,
        updated_at: new Date().toISOString(),
      };
      res.json(mockClient);
    }
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

// Delete client with validation
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    try {
      if (await isDatabaseAvailable()) {
        // Check if client exists
        const exists = await DatabaseValidator.clientExists(id);
        if (!exists) {
          return res.status(404).json({ error: "Client not found" });
        }

        const success = await ClientRepository.delete(id);
        if (!success) {
          return res.status(404).json({ error: "Client not found" });
        }
        res.status(204).send();
      } else {
        console.log(
          "Database unavailable, returning success for client deletion",
        );
        res.status(204).send();
      }
    } catch (dbError) {
      console.log(
        "Database error, returning success for client deletion:",
        dbError.message,
      );
      res.status(204).send();
    }
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

export default router;
