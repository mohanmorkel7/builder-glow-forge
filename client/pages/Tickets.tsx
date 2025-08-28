import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Paperclip,
  Calendar,
  User,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import CreateTicketForm from "@/components/CreateTicketForm";
import TicketDetails from "@/components/TicketDetails";

interface Ticket {
  id: number;
  track_id: string;
  subject: string;
  description?: string;
  created_at: string;
  updated_at: string;
  priority?: { id: number; name: string; color: string; level: number };
  status?: { id: number; name: string; color: string; is_closed: boolean };
  category?: { id: number; name: string; color: string };
  creator?: { id: number; name: string; email: string };
  assignee?: { id: number; name: string; email: string };
}

interface TicketFilters {
  search?: string;
  status_id?: number;
  priority_id?: number;
  category_id?: number;
  assigned_to?: number;
}

export default function Tickets() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<TicketFilters>({});
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Fetch tickets
  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: ["tickets", filters, page],
    queryFn: () => apiClient.getTickets(filters, page, 20),
  });

  // Fetch metadata
  const { data: metadata } = useQuery({
    queryKey: ["ticket-metadata"],
    queryFn: () => apiClient.getTicketMetadata(),
  });

  const handleFilterChange = (key: keyof TicketFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
    setPage(1);
  };

  const handleTicketCreated = () => {
    setIsCreateDialogOpen(false);
    refetchTickets();
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailsDialogOpen(true);
  };

  const getPriorityColor = (priority?: { color: string; level: number }) => {
    if (!priority) return "bg-gray-100 text-gray-800";
    return `bg-gray-100 text-gray-800`;
  };

  const getStatusColor = (status?: { color: string; is_closed: boolean }) => {
    if (!status) return "bg-gray-100 text-gray-800";
    return status.is_closed
      ? "bg-gray-100 text-gray-600"
      : "bg-blue-100 text-blue-800";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-1">Manage and track support tickets</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <div className="max-h-[calc(85vh-80px)] overflow-y-auto">
              <CreateTicketForm
                onSuccess={handleTicketCreated}
                metadata={metadata}
                currentUser={user}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tickets..."
                  value={filters.search || ""}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={filters.status_id?.toString() || "all"}
              onValueChange={(value) =>
                handleFilterChange(
                  "status_id",
                  value === "all" ? undefined : parseInt(value),
                )
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {metadata?.statuses?.map((status) => (
                  <SelectItem key={status.id} value={status.id.toString()}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.priority_id?.toString() || "all"}
              onValueChange={(value) =>
                handleFilterChange(
                  "priority_id",
                  value === "all" ? undefined : parseInt(value),
                )
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {metadata?.priorities?.map((priority) => (
                  <SelectItem key={priority.id} value={priority.id.toString()}>
                    {priority.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.category_id?.toString() || "all"}
              onValueChange={(value) =>
                handleFilterChange(
                  "category_id",
                  value === "all" ? undefined : parseInt(value),
                )
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {metadata?.categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {ticketsLoading ? (
            <div className="text-center py-8">Loading tickets...</div>
          ) : (
            <div className="space-y-4">
              {ticketsData?.tickets?.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewTicket(ticket)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {ticket.track_id}
                          </Badge>
                          {ticket.priority && (
                            <Badge
                              className={getPriorityColor(ticket.priority)}
                            >
                              {ticket.priority.name}
                            </Badge>
                          )}
                          {ticket.status && (
                            <Badge className={getStatusColor(ticket.status)}>
                              {ticket.status.name}
                            </Badge>
                          )}
                          {ticket.category && (
                            <Badge
                              variant="secondary"
                              style={{
                                backgroundColor: `${ticket.category.color}20`,
                                color: ticket.category.color,
                              }}
                            >
                              {ticket.category.name}
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-semibold text-lg mb-1">
                          {ticket.subject}
                        </h3>

                        {ticket.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {ticket.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>Created by {ticket.creator?.name}</span>
                          </div>
                          {ticket.assignee && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>Assigned to {ticket.assignee?.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatDistanceToNow(
                                new Date(ticket.created_at),
                                { addSuffix: true },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewTicket(ticket);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {ticketsData?.tickets?.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No tickets found</p>
                  </CardContent>
                </Card>
              )}

              {/* Pagination */}
              {ticketsData && ticketsData.pages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {page} of {ticketsData.pages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page === ticketsData.pages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Other tab contents would be similar with different filters */}
        <TabsContent value="my-tickets">
          <div className="text-center py-8 text-gray-500">
            My tickets view - would filter by created_by
          </div>
        </TabsContent>

        <TabsContent value="assigned">
          <div className="text-center py-8 text-gray-500">
            Assigned tickets view - would filter by assigned_to
          </div>
        </TabsContent>

        <TabsContent value="open">
          <div className="text-center py-8 text-gray-500">
            Open tickets view - would filter by open statuses
          </div>
        </TabsContent>

        <TabsContent value="closed">
          <div className="text-center py-8 text-gray-500">
            Closed tickets view - would filter by closed statuses
          </div>
        </TabsContent>
      </Tabs>

      {/* Ticket Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <TicketDetails
              ticket={selectedTicket}
              onUpdate={refetchTickets}
              metadata={metadata}
              currentUser={user}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
