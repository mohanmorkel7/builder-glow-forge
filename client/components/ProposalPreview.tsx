import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Download,
  Upload,
  Plus,
  Trash2,
  FileText,
  Eye,
  Image as ImageIcon,
  Signature,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";

interface ProposalSection {
  id: string;
  title: string;
  content: string;
  type: "text" | "table" | "image";
  tableData?: TableData;
  imageUrl?: string;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

interface ProposalData {
  title: string;
  clientName: string;
  leadId: string;
  value: number;
  validUntil: string;
  logoUrl?: string;
  sections: ProposalSection[];
  signatureFields: SignatureField[];
}

interface SignatureField {
  id: string;
  label: string;
  name: string;
  title: string;
  date: string;
}

const defaultSections: ProposalSection[] = [
  {
    id: "executive-summary",
    title: "Executive Summary",
    content:
      "This proposal outlines our comprehensive solution to meet your business requirements. Our team is committed to delivering exceptional results within the proposed timeline and budget.",
    type: "text",
  },
  {
    id: "scope-of-work",
    title: "Scope of Work",
    content:
      "• Phase 1: Analysis and Planning\n• Phase 2: Development and Implementation\n• Phase 3: Testing and Quality Assurance\n• Phase 4: Deployment and Training\n• Phase 5: Ongoing Support and Maintenance",
    type: "text",
  },
  {
    id: "pricing",
    title: "Pricing Breakdown",
    content: "",
    type: "table",
    tableData: {
      headers: ["Item", "Description", "Quantity", "Unit Price", "Total"],
      rows: [
        [
          "Development",
          "Custom Software Development",
          "1",
          "$45,000",
          "$45,000",
        ],
        ["Design", "UI/UX Design Services", "1", "$15,000", "$15,000"],
        ["Testing", "Quality Assurance", "1", "$8,000", "$8,000"],
        ["Deployment", "Production Deployment", "1", "$5,000", "$5,000"],
      ],
    },
  },
  {
    id: "timeline",
    title: "Project Timeline",
    content:
      "The project will be completed in 12 weeks with the following milestones:\n\nWeek 1-2: Project Setup and Analysis\nWeek 3-6: Core Development\nWeek 7-9: Testing and Refinement\nWeek 10-11: User Acceptance Testing\nWeek 12: Deployment and Go-Live",
    type: "text",
  },
];

const defaultSignatureFields: SignatureField[] = [
  {
    id: "client-signature",
    label: "Client Approval",
    name: "",
    title: "",
    date: "",
  },
  {
    id: "company-signature",
    label: "Company Representative",
    name: "",
    title: "",
    date: "",
  },
];

interface ProposalPreviewProps {
  initialData?: Partial<ProposalData>;
  onSave?: (data: ProposalData) => void;
}

export default function ProposalPreview({
  initialData,
  onSave,
}: ProposalPreviewProps) {
  const [proposalData, setProposalData] = useState<ProposalData>({
    title: initialData?.title || "Business Proposal",
    clientName: initialData?.clientName || "",
    leadId: initialData?.leadId || "",
    value: initialData?.value || 0,
    validUntil: initialData?.validUntil || "",
    logoUrl: initialData?.logoUrl || "",
    sections: initialData?.sections || defaultSections,
    signatureFields: initialData?.signatureFields || defaultSignatureFields,
  });

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const updateProposalField = (field: keyof ProposalData, value: any) => {
    setProposalData((prev) => ({ ...prev, [field]: value }));
  };

  const updateSection = (
    sectionId: string,
    updates: Partial<ProposalSection>,
  ) => {
    setProposalData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section,
      ),
    }));
  };

  const addSection = () => {
    const newSection: ProposalSection = {
      id: `section-${Date.now()}`,
      title: "New Section",
      content: "",
      type: "text",
    };
    setProposalData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const removeSection = (sectionId: string) => {
    setProposalData((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== sectionId),
    }));
  };

  const addTableRow = (sectionId: string) => {
    setProposalData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id === sectionId && section.tableData) {
          return {
            ...section,
            tableData: {
              ...section.tableData,
              rows: [
                ...section.tableData.rows,
                new Array(section.tableData.headers.length).fill(""),
              ],
            },
          };
        }
        return section;
      }),
    }));
  };

  const updateTableCell = (
    sectionId: string,
    rowIndex: number,
    cellIndex: number,
    value: string,
  ) => {
    setProposalData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id === sectionId && section.tableData) {
          const newRows = [...section.tableData.rows];
          newRows[rowIndex][cellIndex] = value;
          return {
            ...section,
            tableData: {
              ...section.tableData,
              rows: newRows,
            },
          };
        }
        return section;
      }),
    }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateProposalField("logoUrl", e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (
    sectionId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateSection(sectionId, { imageUrl: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadAsPDF = async () => {
    if (!documentRef.current) return;

    const canvas = await html2canvas(documentRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(
      `${proposalData.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_proposal.pdf`,
    );
  };

  const downloadAsWord = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${proposalData.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
            .logo { max-width: 200px; margin-bottom: 20px; }
            h1 { color: #2563eb; font-size: 28px; margin-bottom: 10px; }
            h2 { color: #374151; font-size: 20px; margin-top: 30px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .signature-section { margin-top: 50px; }
            .signature-field { display: inline-block; width: 45%; margin: 20px 2.5%; vertical-align: top; }
            .signature-line { border-bottom: 1px solid #000; height: 40px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          ${documentRef.current?.innerHTML || ""}
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    saveAs(
      blob,
      `${proposalData.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_proposal.docx`,
    );
  };

  const updateSignatureField = (
    fieldId: string,
    field: keyof SignatureField,
    value: string,
  ) => {
    setProposalData((prev) => ({
      ...prev,
      signatureFields: prev.signatureFields.map((sig) =>
        sig.id === fieldId ? { ...sig, [field]: value } : sig,
      ),
    }));
  };

  const DocumentContent = () => (
    <div ref={documentRef} className="bg-white p-8 max-w-4xl mx-auto shadow-lg">
      {/* Header with Logo */}
      <div className="text-center mb-8 border-b-2 border-blue-600 pb-6">
        {proposalData.logoUrl && (
          <img
            src={proposalData.logoUrl}
            alt="Company Logo"
            className="mx-auto mb-4 max-w-48 max-h-24 object-contain"
          />
        )}
        <h1 className="text-3xl font-bold text-blue-600 mb-2">
          {proposalData.title}
        </h1>
        <div className="text-gray-600 space-y-1">
          <p className="text-lg">
            <strong>Client:</strong> {proposalData.clientName}
          </p>
          {proposalData.leadId && (
            <p>
              <strong>Lead ID:</strong> {proposalData.leadId}
            </p>
          )}
          {proposalData.value > 0 && (
            <p>
              <strong>Project Value:</strong> $
              {proposalData.value.toLocaleString()}
            </p>
          )}
          {proposalData.validUntil && (
            <p>
              <strong>Valid Until:</strong>{" "}
              {new Date(proposalData.validUntil).toLocaleDateString()}
            </p>
          )}
          <p>
            <strong>Date:</strong> {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Sections */}
      {proposalData.sections.map((section) => (
        <div key={section.id} className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-300 pb-2">
            {section.title}
          </h2>

          {section.type === "text" && (
            <div className="prose max-w-none">
              {section.content.split("\n").map((line, index) => (
                <p key={index} className="mb-2">
                  {line}
                </p>
              ))}
            </div>
          )}

          {section.type === "table" && section.tableData && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    {section.tableData.headers.map((header, index) => (
                      <th
                        key={index}
                        className="border border-gray-300 px-4 py-2 text-left font-semibold"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.tableData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="border border-gray-300 px-4 py-2"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {section.type === "image" && section.imageUrl && (
            <div className="text-center">
              <img
                src={section.imageUrl}
                alt={section.title}
                className="max-w-full h-auto mx-auto rounded-lg shadow-md"
              />
            </div>
          )}
        </div>
      ))}

      {/* Signature Section */}
      {proposalData.signatureFields.length > 0 && (
        <div className="mt-12 border-t border-gray-300 pt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Signatures
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {proposalData.signatureFields.map((signature) => (
              <div key={signature.id} className="space-y-4">
                <h3 className="font-medium text-gray-700">{signature.label}</h3>
                <div className="space-y-3">
                  <div>
                    <div className="border-b-2 border-gray-400 h-12 mb-2"></div>
                    <p className="text-sm text-gray-600">Signature</p>
                  </div>
                  <div>
                    <div className="border-b border-gray-400 h-8 mb-1">
                      {signature.name && (
                        <span className="text-sm">{signature.name}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Name</p>
                  </div>
                  <div>
                    <div className="border-b border-gray-400 h-8 mb-1">
                      {signature.title && (
                        <span className="text-sm">{signature.title}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Title</p>
                  </div>
                  <div>
                    <div className="border-b border-gray-400 h-8 mb-1">
                      {signature.date && (
                        <span className="text-sm">{signature.date}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Date</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-gray-500 border-t border-gray-300 pt-4">
        <p>
          This proposal is confidential and proprietary. Generated on{" "}
          {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );

  if (isPreviewMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => setIsPreviewMode(false)}>
              <FileText className="w-4 h-4 mr-2" />
              Edit Mode
            </Button>
            <span className="text-sm text-gray-600">Preview Mode</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={downloadAsPDF}
              className="bg-red-600 hover:bg-red-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button
              onClick={downloadAsWord}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Word
            </Button>
          </div>
        </div>
        <DocumentContent />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800">
          Proposal Builder
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setIsPreviewMode(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          {onSave && (
            <Button onClick={() => onSave(proposalData)}>Save Proposal</Button>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Set up the core details of your proposal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Proposal Title</Label>
              <Input
                id="title"
                value={proposalData.title}
                onChange={(e) => updateProposalField("title", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={proposalData.clientName}
                onChange={(e) =>
                  updateProposalField("clientName", e.target.value)
                }
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="leadId">Lead ID</Label>
              <Input
                id="leadId"
                value={proposalData.leadId}
                onChange={(e) => updateProposalField("leadId", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="value">Project Value ($)</Label>
              <Input
                id="value"
                type="number"
                value={proposalData.value}
                onChange={(e) =>
                  updateProposalField("value", parseFloat(e.target.value) || 0)
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={proposalData.validUntil}
                onChange={(e) =>
                  updateProposalField("validUntil", e.target.value)
                }
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="logo">Company Logo</Label>
            <div className="flex items-center space-x-4 mt-1">
              <Button
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Logo</span>
              </Button>
              {proposalData.logoUrl && (
                <img
                  src={proposalData.logoUrl}
                  alt="Logo preview"
                  className="h-12 w-auto rounded border"
                />
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Proposal Sections</CardTitle>
              <CardDescription>
                Build your proposal with customizable sections
              </CardDescription>
            </div>
            <Button onClick={addSection} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {proposalData.sections.map((section, index) => (
            <div key={section.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <Input
                    value={section.title}
                    onChange={(e) =>
                      updateSection(section.id, { title: e.target.value })
                    }
                    className="font-medium"
                    placeholder="Section title"
                  />
                  <select
                    value={section.type}
                    onChange={(e) =>
                      updateSection(section.id, {
                        type: e.target.value as "text" | "table" | "image",
                      })
                    }
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="text">Text</option>
                    <option value="table">Table</option>
                    <option value="image">Image</option>
                  </select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeSection(section.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {section.type === "text" && (
                <Textarea
                  value={section.content}
                  onChange={(e) =>
                    updateSection(section.id, { content: e.target.value })
                  }
                  rows={6}
                  placeholder="Enter section content..."
                />
              )}

              {section.type === "table" && section.tableData && (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {section.tableData.headers.map(
                            (header, headerIndex) => (
                              <TableHead key={headerIndex}>
                                <Input
                                  value={header}
                                  onChange={(e) => {
                                    const newHeaders = [
                                      ...section.tableData!.headers,
                                    ];
                                    newHeaders[headerIndex] = e.target.value;
                                    updateSection(section.id, {
                                      tableData: {
                                        ...section.tableData!,
                                        headers: newHeaders,
                                      },
                                    });
                                  }}
                                  className="font-medium"
                                />
                              </TableHead>
                            ),
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.tableData.rows.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <TableCell key={cellIndex}>
                                <Input
                                  value={cell}
                                  onChange={(e) =>
                                    updateTableCell(
                                      section.id,
                                      rowIndex,
                                      cellIndex,
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTableRow(section.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Row
                  </Button>
                </div>
              )}

              {section.type === "image" && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) =>
                          handleImageUpload(section.id, e as any);
                        input.click();
                      }}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                    {section.imageUrl && (
                      <img
                        src={section.imageUrl}
                        alt="Section image"
                        className="h-20 w-auto rounded border"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Signature Fields */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Signature className="w-5 h-5 inline mr-2" />
            Signature Fields
          </CardTitle>
          <CardDescription>
            Configure signature requirements for the proposal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {proposalData.signatureFields.map((signature) => (
            <div
              key={signature.id}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg"
            >
              <Input
                placeholder="Signature label"
                value={signature.label}
                onChange={(e) =>
                  updateSignatureField(signature.id, "label", e.target.value)
                }
              />
              <Input
                placeholder="Name (optional)"
                value={signature.name}
                onChange={(e) =>
                  updateSignatureField(signature.id, "name", e.target.value)
                }
              />
              <Input
                placeholder="Title (optional)"
                value={signature.title}
                onChange={(e) =>
                  updateSignatureField(signature.id, "title", e.target.value)
                }
              />
              <Input
                type="date"
                placeholder="Date"
                value={signature.date}
                onChange={(e) =>
                  updateSignatureField(signature.id, "date", e.target.value)
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
