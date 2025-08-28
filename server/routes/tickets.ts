import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  TicketRepository,
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketFilters,
} from "../models/Ticket";
import { normalizeUserId } from "../services/mockData";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "public/uploads/tickets";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `ticket-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /\.(jpg|jpeg|png|gif|pdf|doc|docx|txt|csv|xlsx|xls)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

// Helper function to check if database is available
async function isDatabaseAvailable() {
  try {
    await TicketRepository.getPriorities();
    return true;
  } catch (error) {
    console.log("Database not available for tickets:", error.message);
    return false;
  }
}

// Get ticket metadata (priorities, statuses, categories)
router.get("/metadata", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const priorities = await TicketRepository.getPriorities();
      const statuses = await TicketRepository.getStatuses();
      const categories = await TicketRepository.getCategories();

      res.json({ priorities, statuses, categories });
    } else {
      // Mock metadata for development
      res.json({
        priorities: [
          { id: 1, name: "Low", level: 1, color: "#10B981" },
          { id: 2, name: "Medium", level: 2, color: "#F59E0B" },
          { id: 3, name: "High", level: 3, color: "#EF4444" },
          { id: 4, name: "Critical", level: 4, color: "#DC2626" },
        ],
        statuses: [
          {
            id: 1,
            name: "Open",
            color: "#3B82F6",
            is_closed: false,
            sort_order: 1,
          },
          {
            id: 2,
            name: "In Progress",
            color: "#F59E0B",
            is_closed: false,
            sort_order: 2,
          },
          {
            id: 3,
            name: "Pending",
            color: "#8B5CF6",
            is_closed: false,
            sort_order: 3,
          },
          {
            id: 4,
            name: "Resolved",
            color: "#10B981",
            is_closed: true,
            sort_order: 4,
          },
          {
            id: 5,
            name: "Closed",
            color: "#6B7280",
            is_closed: true,
            sort_order: 5,
          },
        ],
        categories: [
          {
            id: 1,
            name: "Technical Issue",
            description: "Technical problems and bugs",
            color: "#EF4444",
          },
          {
            id: 2,
            name: "Feature Request",
            description: "New feature requests",
            color: "#3B82F6",
          },
          {
            id: 3,
            name: "Support",
            description: "General support",
            color: "#10B981",
          },
          {
            id: 4,
            name: "Documentation",
            description: "Documentation related",
            color: "#8B5CF6",
          },
          {
            id: 5,
            name: "Training",
            description: "Training related",
            color: "#F59E0B",
          },
        ],
      });
    }
  } catch (error) {
    console.error("Error fetching ticket metadata:", error);
    res.status(500).json({ error: "Failed to fetch metadata" });
  }
});

// Get all tickets with filtering and pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const filters: TicketFilters = {
      status_id: req.query.status_id
        ? parseInt(req.query.status_id as string)
        : undefined,
      priority_id: req.query.priority_id
        ? parseInt(req.query.priority_id as string)
        : undefined,
      category_id: req.query.category_id
        ? parseInt(req.query.category_id as string)
        : undefined,
      assigned_to: req.query.assigned_to
        ? normalizeUserId(req.query.assigned_to as string)
        : undefined,
      created_by: req.query.created_by
        ? normalizeUserId(req.query.created_by as string)
        : undefined,
      search: req.query.search as string,
      tags: req.query.tags ? (req.query.tags as string).split(",") : undefined,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (await isDatabaseAvailable()) {
      const result = await TicketRepository.getAll(filters, page, limit);
      res.json(result);
    } else {
      // Mock tickets for development
      const mockTickets = [
        {
          id: 1,
          track_id: "TKT-0001",
          subject: "Login page not loading",
          description:
            "Users are reporting that the login page is not loading properly",
          priority_id: 3,
          status_id: 2,
          category_id: 1,
          created_by: 1,
          assigned_to: 1,
          created_at: new Date("2024-01-15T10:00:00Z"),
          updated_at: new Date("2024-01-15T10:00:00Z"),
          priority: { id: 3, name: "High", level: 3, color: "#EF4444" },
          status: {
            id: 2,
            name: "In Progress",
            color: "#F59E0B",
            is_closed: false,
            sort_order: 2,
          },
          category: { id: 1, name: "Technical Issue", color: "#EF4444" },
          creator: { id: 1, name: "John Doe", email: "admin@banani.com" },
          assignee: { id: 1, name: "John Doe", email: "admin@banani.com" },
        },
        {
          id: 2,
          track_id: "TKT-0002",
          subject: "Add dark mode feature",
          description: "Request to add dark mode support to the application",
          priority_id: 2,
          status_id: 1,
          category_id: 2,
          created_by: 2,
          assigned_to: 3,
          created_at: new Date("2024-01-16T14:30:00Z"),
          updated_at: new Date("2024-01-16T14:30:00Z"),
          priority: { id: 2, name: "Medium", level: 2, color: "#F59E0B" },
          status: {
            id: 1,
            name: "Open",
            color: "#3B82F6",
            is_closed: false,
            sort_order: 1,
          },
          category: { id: 2, name: "Feature Request", color: "#3B82F6" },
          creator: { id: 2, name: "Jane Smith", email: "sales@banani.com" },
          assignee: {
            id: 3,
            name: "Mike Johnson",
            email: "product@banani.com",
          },
        },
      ];

      res.json({
        tickets: mockTickets,
        total: mockTickets.length,
        pages: 1,
      });
    }
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

// Get ticket by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    if (await isDatabaseAvailable()) {
      const ticket = await TicketRepository.getById(id);
      res.json(ticket);
    } else {
      // Mock single ticket
      res.json({
        id: 1,
        track_id: "TKT-0001",
        subject: "Login page not loading",
        description:
          "Users are reporting that the login page is not loading properly",
        priority_id: 3,
        status_id: 2,
        category_id: 1,
        created_by: 1,
        assigned_to: 1,
        created_at: new Date("2024-01-15T10:00:00Z"),
        updated_at: new Date("2024-01-15T10:00:00Z"),
        priority: { id: 3, name: "High", level: 3, color: "#EF4444" },
        status: {
          id: 2,
          name: "In Progress",
          color: "#F59E0B",
          is_closed: false,
          sort_order: 2,
        },
        category: { id: 1, name: "Technical Issue", color: "#EF4444" },
        creator: { id: 1, name: "John Doe", email: "admin@banani.com" },
        assignee: { id: 1, name: "John Doe", email: "admin@banani.com" },
      });
    }
  } catch (error) {
    console.error("Error fetching ticket:", error);
    if (error.message === "Ticket not found") {
      res.status(404).json({ error: "Ticket not found" });
    } else {
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  }
});

// Get ticket by track ID
router.get("/track/:trackId", async (req: Request, res: Response) => {
  try {
    const trackId = req.params.trackId;

    if (await isDatabaseAvailable()) {
      const ticket = await TicketRepository.getByTrackId(trackId);
      res.json(ticket);
    } else {
      // Mock response
      if (trackId === "TKT-0001") {
        res.json({
          id: 1,
          track_id: "TKT-0001",
          subject: "Login page not loading",
          description:
            "Users are reporting that the login page is not loading properly",
          created_at: new Date("2024-01-15T10:00:00Z"),
        });
      } else {
        res.status(404).json({ error: "Ticket not found" });
      }
    }
  } catch (error) {
    console.error("Error fetching ticket by track ID:", error);
    if (error.message === "Ticket not found") {
      res.status(404).json({ error: "Ticket not found" });
    } else {
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  }
});

// Create new ticket
router.post(
  "/",
  upload.array("attachments", 5),
  async (req: Request, res: Response) => {
    try {
      const ticketData: CreateTicketRequest = req.body;
      const createdBy = normalizeUserId(req.body.created_by || "1");

      // Parse JSON fields if they're strings
      if (typeof ticketData.tags === "string") {
        ticketData.tags = JSON.parse(ticketData.tags);
      }
      if (typeof ticketData.custom_fields === "string") {
        ticketData.custom_fields = JSON.parse(ticketData.custom_fields);
      }

      if (await isDatabaseAvailable()) {
        const ticket = await TicketRepository.create(ticketData, createdBy);

        // Handle file attachments
        if (req.files && Array.isArray(req.files)) {
          for (const file of req.files) {
            // Store attachment info in database (would be implemented in TicketRepository)
            console.log(
              "Uploaded file:",
              file.filename,
              "for ticket:",
              ticket.id,
            );
          }
        }

        res.status(201).json(ticket);
      } else {
        // Mock ticket creation
        const mockTicket = {
          id: Math.floor(Math.random() * 1000),
          track_id: `TKT-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
          subject: ticketData.subject,
          description: ticketData.description,
          priority_id: ticketData.priority_id,
          status_id: 1, // Default to Open
          category_id: ticketData.category_id,
          created_by: createdBy,
          assigned_to: ticketData.assigned_to,
          created_at: new Date(),
          updated_at: new Date(),
        };

        console.log("Mock ticket created:", mockTicket.track_id);
        res.status(201).json(mockTicket);
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ error: "Failed to create ticket" });
    }
  },
);

// Update ticket
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    const updateData: UpdateTicketRequest = req.body;
    const updatedBy = normalizeUserId(req.body.updated_by || "1");

    if (await isDatabaseAvailable()) {
      const ticket = await TicketRepository.update(id, updateData, updatedBy);
      res.json(ticket);
    } else {
      // Mock update
      console.log("Mock ticket update for ID:", id);
      res.json({
        id,
        track_id: "TKT-0001",
        subject: updateData.subject || "Updated ticket",
        ...updateData,
        updated_at: new Date(),
      });
    }
  } catch (error) {
    console.error("Error updating ticket:", error);
    if (error.message === "Ticket not found") {
      res.status(404).json({ error: "Ticket not found" });
    } else {
      res.status(500).json({ error: "Failed to update ticket" });
    }
  }
});

// Delete ticket
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    if (await isDatabaseAvailable()) {
      await TicketRepository.delete(id);
      res.status(204).send();
    } else {
      // Mock deletion
      console.log("Mock ticket deletion for ID:", id);
      res.status(204).send();
    }
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({ error: "Failed to delete ticket" });
  }
});

// Get comments for a ticket
router.get("/:id/comments", async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    if (await isDatabaseAvailable()) {
      const comments = await TicketRepository.getComments(ticketId);
      res.json(comments);
    } else {
      // Mock comments
      res.json([
        {
          id: 1,
          ticket_id: ticketId,
          user_id: 1,
          content:
            "<p>This is the <strong>initial comment</strong> for the ticket with <em>rich formatting</em>.</p>",
          is_internal: false,
          created_at: new Date("2024-01-15T10:05:00Z"),
          attachments: [],
          user: { id: 1, name: "John Doe", email: "admin@banani.com" },
        },
        {
          id: 2,
          ticket_id: ticketId,
          user_id: 2,
          content:
            "<p>I'm investigating this issue. See attached <a href='#'>documentation</a>.</p>",
          is_internal: true,
          created_at: new Date("2024-01-15T11:00:00Z"),
          attachments: [
            {
              id: 1,
              filename: "investigation-notes.pdf",
              original_filename: "investigation-notes.pdf",
              file_path: "/uploads/tickets/investigation-notes.pdf",
              file_size: 1024000,
              mime_type: "application/pdf",
              uploaded_at: new Date("2024-01-15T11:00:00Z"),
            },
          ],
          user: { id: 2, name: "Jane Smith", email: "sales@banani.com" },
        },
      ]);
    }
  } catch (error) {
    console.error("Error fetching ticket comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Add comment to ticket
router.post("/:id/comments", async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    const {
      content,
      is_internal = false,
      parent_comment_id,
      mentions,
    } = req.body;
    const userId = normalizeUserId(req.body.user_id || "1");

    if (!content) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    if (await isDatabaseAvailable()) {
      const comment = await TicketRepository.addComment(
        ticketId,
        userId,
        content,
        is_internal,
        parent_comment_id,
        mentions,
      );
      res.status(201).json(comment);
    } else {
      // Mock comment creation
      const mockComment = {
        id: Math.floor(Math.random() * 1000),
        ticket_id: ticketId,
        user_id: userId,
        content,
        is_internal,
        parent_comment_id,
        mentions,
        created_at: new Date(),
        updated_at: new Date(),
        user: { id: userId, name: "Current User", email: "user@banani.com" },
      };

      console.log("Mock comment created for ticket:", ticketId);
      res.status(201).json(mockComment);
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Get user notifications
router.get("/notifications/:userId", async (req: Request, res: Response) => {
  try {
    const userId = normalizeUserId(req.params.userId);
    const unreadOnly = req.query.unread_only === "true";

    if (await isDatabaseAvailable()) {
      const notifications = await TicketRepository.getUserNotifications(
        userId,
        unreadOnly,
      );
      res.json(notifications);
    } else {
      // Mock notifications
      res.json([
        {
          id: 1,
          ticket_id: 1,
          user_id: userId,
          type: "assigned",
          message:
            "You have been assigned to ticket TKT-0001: Login page not loading",
          is_read: false,
          created_at: new Date("2024-01-15T10:00:00Z"),
          ticket: { track_id: "TKT-0001", subject: "Login page not loading" },
        },
      ]);
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.put(
  "/notifications/:notificationId/read",
  async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.notificationId);
      if (isNaN(notificationId)) {
        return res.status(400).json({ error: "Invalid notification ID" });
      }

      if (await isDatabaseAvailable()) {
        await TicketRepository.markNotificationAsRead(notificationId);
        res.status(204).send();
      } else {
        // Mock notification update
        console.log("Mock notification marked as read:", notificationId);
        res.status(204).send();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  },
);

// Upload attachment to existing ticket
router.post(
  "/:id/attachments",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ error: "Invalid ticket ID" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = normalizeUserId(req.body.user_id || "1");
      const commentId = req.body.comment_id
        ? parseInt(req.body.comment_id)
        : undefined;

      if (await isDatabaseAvailable()) {
        // In real implementation, save attachment to database
        console.log(
          "File uploaded for ticket:",
          ticketId,
          "File:",
          req.file.filename,
        );

        res.status(201).json({
          id: Math.floor(Math.random() * 1000),
          ticket_id: ticketId,
          comment_id: commentId,
          user_id: userId,
          filename: req.file.filename,
          original_filename: req.file.originalname,
          file_path: `/uploads/tickets/${req.file.filename}`,
          file_size: req.file.size,
          mime_type: req.file.mimetype,
          uploaded_at: new Date(),
        });
      } else {
        // Mock attachment upload
        res.status(201).json({
          id: Math.floor(Math.random() * 1000),
          ticket_id: ticketId,
          filename: req.file.filename,
          original_filename: req.file.originalname,
          file_path: `/uploads/tickets/${req.file.filename}`,
          file_size: req.file.size,
          uploaded_at: new Date(),
        });
      }
    } catch (error) {
      console.error("Error uploading attachment:", error);
      res.status(500).json({ error: "Failed to upload attachment" });
    }
  },
);

export default router;
