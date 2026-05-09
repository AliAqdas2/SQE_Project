import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Mail, Star, Type, List, Minus, Image as ImageIcon, Trash2, AlignLeft, AlignCenter, AlignRight, ChevronUp, ChevronDown, X, AlertTriangle, Copy } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ContentBlock = {
  id: string;
  type: "heading" | "subheading" | "paragraph" | "bullets" | "divider" | "image";
  content: string;
  color?: string;
  align?: "left" | "center" | "right";
  items?: string[];
};

interface EmailTemplate {
  id: string;
  orgId: string;
  templateType: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  blocks?: ContentBlock[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function EmailTemplatesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showLegacyWarning, setShowLegacyWarning] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [templateType, setTemplateType] = useState("thank_you");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [textBody, setTextBody] = useState("");
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    {
      id: crypto.randomUUID(),
      type: "paragraph",
      content: "Dear {{donorName}},",
      align: "left",
    },
    {
      id: crypto.randomUUID(),
      type: "paragraph",
      content: "Thank you for your generous donation of {{amount}}!",
      align: "left",
    },
  ]);

  const { data: templates, isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/org/org-1/email-templates"],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingTemplate) {
        // Update existing template
        return await apiRequest("PATCH", `/api/org/org-1/email-templates/${editingTemplate.id}`, data);
      } else {
        // Create new template
        return await apiRequest("POST", "/api/org/org-1/email-templates", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org/org-1/email-templates"] });
      toast({ 
        title: "Success", 
        description: editingTemplate ? "Email template updated successfully" : "Email template created successfully" 
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || `Failed to ${editingTemplate ? "update" : "create"} template`, 
        variant: "destructive" 
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return await apiRequest("POST", `/api/org/org-1/email-templates/${templateId}/set-default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org/org-1/email-templates"] });
      toast({ title: "Success", description: "Default template updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to set default", variant: "destructive" });
    },
  });

  const addBlock = (type: ContentBlock["type"]) => {
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      content: type === "divider" ? "" : type === "image" ? "" : "Type your text here...",
      align: "left",
      color: "#000000",
      items: type === "bullets" ? ["Item 1", "Item 2"] : undefined,
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setContentBlocks(contentBlocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id: string) => {
    setContentBlocks(contentBlocks.filter(block => block.id !== id));
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    const index = contentBlocks.findIndex(block => block.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === contentBlocks.length - 1) return;

    const newBlocks = [...contentBlocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setContentBlocks(newBlocks);
  };

  const generateHTML = (blocks: ContentBlock[]): string => {
    return blocks.map(block => {
      const style = `text-align: ${block.align || 'left'}; color: ${block.color || '#000000'};`;
      
      switch (block.type) {
        case "heading":
          return `<h1 style="${style} font-size: 28px; font-weight: bold; margin: 20px 0 10px;">${block.content}</h1>`;
        case "subheading":
          return `<h2 style="${style} font-size: 20px; font-weight: 600; margin: 15px 0 8px;">${block.content}</h2>`;
        case "paragraph":
          return `<p style="${style} font-size: 16px; line-height: 1.6; margin: 10px 0;">${block.content}</p>`;
        case "bullets":
          const items = block.items || [];
          return `<ul style="${style} margin: 10px 0; padding-left: 20px;">
            ${items.map(item => `<li style="margin: 5px 0;">${item}</li>`).join('')}
          </ul>`;
        case "divider":
          return `<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />`;
        case "image":
          return block.content ? `<img src="${block.content}" style="max-width: 100%; height: auto; display: block; margin: 10px auto;" alt="Email image" />` : '';
        default:
          return '';
      }
    }).join('\n');
  };

  const generateTextBody = (blocks: ContentBlock[]): string => {
    return blocks.map(block => {
      switch (block.type) {
        case "heading":
        case "subheading":
        case "paragraph":
          return block.content;
        case "bullets":
          return (block.items || []).map(item => `• ${item}`).join('\n');
        case "divider":
          return '---';
        case "image":
          return '[Image]';
        default:
          return '';
      }
    }).join('\n\n');
  };

  const handleOpenDialog = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setName(template.name);
      setTemplateType(template.templateType);
      setSubject(template.subject);
      setHtmlBody(template.htmlBody);
      setTextBody(template.textBody);
      // Load blocks from saved template
      if (template.blocks && template.blocks.length > 0) {
        // Migrate old block IDs to ensure uniqueness
        const migratedBlocks = template.blocks.map(block => ({
          ...block,
          id: block.id.startsWith("block-") || block.id.length > 20 ? block.id : crypto.randomUUID()
        }));
        setContentBlocks(migratedBlocks);
        setShowLegacyWarning(false);
      } else {
        // Legacy template without blocks - show warning
        setShowLegacyWarning(true);
        // Load existing content as read-only preview
        setContentBlocks([
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            content: "Dear {{donorName}},",
            align: "left",
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            content: "Thank you for your generous donation of {{amount}}!",
            align: "left",
          },
        ]);
      }
    } else {
      setEditingTemplate(null);
      setName("");
      setTemplateType("thank_you");
      setSubject("Thank you for your donation");
      setHtmlBody("");
      setTextBody("");
      setContentBlocks([
        {
          id: crypto.randomUUID(),
          type: "paragraph",
          content: "Dear {{donorName}},",
          align: "left",
        },
        {
          id: crypto.randomUUID(),
          type: "paragraph",
          content: "Thank you for your generous donation of {{amount}}!",
          align: "left",
        },
      ]);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setShowLegacyWarning(false);
    setName("");
    setTemplateType("thank_you");
    setSubject("Thank you for your donation");
    setHtmlBody("");
    setTextBody("");
    // Reset to default content blocks
    setContentBlocks([
      {
        id: crypto.randomUUID(),
        type: "paragraph",
        content: "Dear {{donorName}},",
        align: "left",
      },
      {
        id: crypto.randomUUID(),
        type: "paragraph",
        content: "Thank you for your generous donation of {{amount}}!",
        align: "left",
      },
    ]);
  };

  const handleCopyToNewTemplate = () => {
    // Create a new template based on the legacy one
    const legacyContent = editingTemplate?.textBody?.trim() || editingTemplate?.htmlBody?.replace(/<[^>]*>/g, '').trim() || "";
    
    setEditingTemplate(null);
    setShowLegacyWarning(false);
    setName(editingTemplate?.name ? `${editingTemplate.name} (Copy)` : "");
    setTemplateType(editingTemplate?.templateType || "thank_you");
    setSubject(editingTemplate?.subject || "Thank you for your donation");
    
    // Create a single paragraph block with the legacy content
    if (legacyContent) {
      setContentBlocks([
        {
          id: crypto.randomUUID(),
          type: "paragraph",
          content: legacyContent,
          align: "left",
        },
      ]);
    }
    
    toast({
      title: "Template copied",
      description: "You can now edit the content using the visual editor. Click 'Create Template' when done.",
    });
  };

  const handleSubmit = () => {
    // Prevent saving legacy templates
    if (showLegacyWarning && editingTemplate) {
      toast({
        title: "Cannot edit legacy template",
        description: "Please copy this template to edit it with the visual editor.",
        variant: "destructive",
      });
      return;
    }

    // Generate HTML and text from content blocks
    const generatedHTML = generateHTML(contentBlocks);
    const generatedText = generateTextBody(contentBlocks);
    
    const data = {
      name,
      templateType,
      subject,
      htmlBody: generatedHTML,
      textBody: generatedText,
      blocks: contentBlocks, // Save blocks as JSON for future editing
      isDefault: false,
      isActive: true,
    };

    createTemplateMutation.mutate(data);
  };

  const handleSetDefault = (templateId: string) => {
    setDefaultMutation.mutate(templateId);
  };

  return (
    <div className="p-8 space-y-6">
      <Breadcrumbs items={[{ label: "Email Templates" }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground mt-1">
            Manage thank you email templates for different donation types
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-template">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
              <DialogDescription>
                Create a customized email template for thank you messages
              </DialogDescription>
            </DialogHeader>
            
            {showLegacyWarning && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Legacy Template Detected</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>
                    This template was created before the visual editor existed. To preserve your content and avoid losing any formatting, please copy this template to a new one instead of editing it directly.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyToNewTemplate}
                      data-testid="button-copy-legacy-template"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to New Template
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Standard Thank You"
                  data-testid="input-template-name"
                  disabled={showLegacyWarning}
                />
              </div>
              <div>
                <Label htmlFor="type">Template Type</Label>
                <Select value={templateType} onValueChange={setTemplateType} disabled={showLegacyWarning}>
                  <SelectTrigger data-testid="select-template-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thank_you">Thank You</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Thank you for your donation"
                  data-testid="input-subject"
                  disabled={showLegacyWarning}
                />
              </div>
              <div className="space-y-3">
                <Label>Email Content</Label>
                <div className="border rounded-lg p-3 space-y-2">
                  {!showLegacyWarning && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addBlock("heading")}
                        data-testid="button-add-heading"
                      >
                        <Type className="h-4 w-4 mr-1" />
                        Heading
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addBlock("subheading")}
                        data-testid="button-add-subheading"
                      >
                        <Type className="h-3 w-3 mr-1" />
                        Subheading
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addBlock("paragraph")}
                        data-testid="button-add-paragraph"
                      >
                        <Type className="h-3 w-3 mr-1" />
                        Text
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addBlock("bullets")}
                        data-testid="button-add-bullets"
                      >
                        <List className="h-4 w-4 mr-1" />
                        Bullets
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addBlock("divider")}
                        data-testid="button-add-divider"
                      >
                        <Minus className="h-4 w-4 mr-1" />
                        Divider
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addBlock("image")}
                        data-testid="button-add-image"
                      >
                        <ImageIcon className="h-4 w-4 mr-1" />
                        Image
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {contentBlocks.map((block, index) => (
                    <div
                      key={block.id}
                      className="border rounded-lg p-3 space-y-2"
                      data-testid={`content-block-${block.type}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline">{block.type}</Badge>
                        {!showLegacyWarning && (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => moveBlock(block.id, "up")}
                              disabled={index === 0}
                              data-testid={`button-move-up-${block.id}`}
                              className="h-7 w-7"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => moveBlock(block.id, "down")}
                              disabled={index === contentBlocks.length - 1}
                              data-testid={`button-move-down-${block.id}`}
                              className="h-7 w-7"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteBlock(block.id)}
                              data-testid={`button-delete-${block.id}`}
                              className="h-7 w-7"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {block.type !== "divider" && (
                        <>
                          {block.type === "bullets" ? (
                            <div className="space-y-2">
                              {(block.items || []).map((item, itemIndex) => (
                                <div key={itemIndex} className="flex gap-2">
                                  <Input
                                    value={item}
                                    onChange={(e) => {
                                      const newItems = [...(block.items || [])];
                                      newItems[itemIndex] = e.target.value;
                                      updateBlock(block.id, { items: newItems });
                                    }}
                                    placeholder={`Item ${itemIndex + 1}`}
                                    data-testid={`input-bullet-${itemIndex}`}
                                    disabled={showLegacyWarning}
                                  />
                                  {!showLegacyWarning && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const newItems = (block.items || []).filter((_, i) => i !== itemIndex);
                                        updateBlock(block.id, { items: newItems });
                                      }}
                                      className="h-9 w-9"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              {!showLegacyWarning && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newItems = [...(block.items || []), "New item"];
                                    updateBlock(block.id, { items: newItems });
                                  }}
                                  data-testid="button-add-bullet-item"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Item
                                </Button>
                              )}
                            </div>
                          ) : (
                            <Textarea
                              value={block.content}
                              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                              placeholder={block.type === "image" ? "Image URL" : "Type your text here..."}
                              rows={block.type === "heading" ? 1 : 2}
                              data-testid={`textarea-${block.id}`}
                              disabled={showLegacyWarning}
                            />
                          )}

                          {!showLegacyWarning && block.type !== "image" && (
                            <div className="flex gap-2">
                              <div className="flex items-center gap-2">
                                <Label className="text-xs">Color:</Label>
                                <Input
                                  type="color"
                                  value={block.color || "#000000"}
                                  onChange={(e) => updateBlock(block.id, { color: e.target.value })}
                                  className="w-16 h-8"
                                  data-testid={`input-color-${block.id}`}
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <Label className="text-xs">Align:</Label>
                                <Button
                                  type="button"
                                  variant={block.align === "left" ? "default" : "outline"}
                                  size="icon"
                                  onClick={() => updateBlock(block.id, { align: "left" })}
                                  className="h-7 w-7"
                                  data-testid={`button-align-left-${block.id}`}
                                >
                                  <AlignLeft className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant={block.align === "center" ? "default" : "outline"}
                                  size="icon"
                                  onClick={() => updateBlock(block.id, { align: "center" })}
                                  className="h-7 w-7"
                                  data-testid={`button-align-center-${block.id}`}
                                >
                                  <AlignCenter className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant={block.align === "right" ? "default" : "outline"}
                                  size="icon"
                                  onClick={() => updateBlock(block.id, { align: "right" })}
                                  className="h-7 w-7"
                                  data-testid={`button-align-right-${block.id}`}
                                >
                                  <AlignRight className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">
                  Use variables: <code className="bg-muted px-1 rounded">{'{'}{'donorName'}{'}'}</code>, <code className="bg-muted px-1 rounded">{'{'}{'amount'}{'}'}</code>, <code className="bg-muted px-1 rounded">{'{'}{'donationType'}{'}'}</code>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel-template">
                Cancel
              </Button>
              {!showLegacyWarning && (
                <Button
                  onClick={handleSubmit}
                  disabled={!name || !subject || createTemplateMutation.isPending}
                  data-testid="button-save-template"
                >
                  {createTemplateMutation.isPending ? "Saving..." : (editingTemplate ? "Update Template" : "Create Template")}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id} data-testid={`card-template-${template.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {template.name}
                    </CardTitle>
                    <CardDescription>
                      {template.templateType.replace("_", " ")}
                    </CardDescription>
                  </div>
                  {template.isDefault && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Default
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Subject:</p>
                    <p className="text-sm text-muted-foreground">{template.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Preview:</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.textBody}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(template)}
                      data-testid={`button-edit-${template.id}`}
                    >
                      Edit
                    </Button>
                    {!template.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(template.id)}
                        disabled={setDefaultMutation.isPending}
                        data-testid={`button-set-default-${template.id}`}
                      >
                        Set as Default
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 opacity-50 mb-4" />
            <p className="text-muted-foreground mb-4">No email templates yet</p>
            <Button onClick={() => handleOpenDialog()} data-testid="button-create-first-template">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
