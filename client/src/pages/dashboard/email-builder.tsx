import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Type, Heading, Link as LinkIcon, Image, Minus, MoveUp, MoveDown, Trash2, Eye, Save, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { EmailTemplate } from "@shared/schema";

type EmailBlock = {
  id: string;
  type: 'text' | 'heading' | 'button' | 'image' | 'divider' | 'spacer';
  content?: string;
  level?: number;
  text?: string;
  url?: string;
  alt?: string;
  href?: string;
  align?: 'left' | 'center' | 'right';
  fontSize?: string;
  color?: string;
  width?: string;
  height?: string;
};

export default function EmailBuilder() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [templateName, setTemplateName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Get current session with user and org data
  const { data: session } = useQuery<{ user: any; organization: any }>({
    queryKey: ["/api/auth/session"],
  });
  
  const user = session?.user;
  const orgId = user?.orgId;
  
  // Load template if editing
  const { data: template } = useQuery<EmailTemplate>({
    queryKey: [`/api/org/${orgId}/email-templates/${params.id}`],
    enabled: !!params.id && !!orgId,
  });
  
  // Load template data when fetched
  if (template && blocks.length === 0 && !templateName) {
    setTemplateName(template.name || "");
    setSubject(template.subject || "");
    setPreviewText(template.previewText || "");
    if (template.blocks) {
      const loadedBlocks = (template.blocks as any[]).map((block, index) => ({
        ...block,
        id: `block-${index}-${Date.now()}`,
      }));
      setBlocks(loadedBlocks);
    }
  }
  
  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        name: templateName,
        subject,
        previewText,
        blocks: blocks.map(({ id, ...block }) => block),
        templateType: 'custom',
      };
      
      if (params.id) {
        const res = await apiRequest('PATCH', `/api/org/${orgId}/email-templates/${params.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest('POST', `/api/org/${orgId}/email-templates`, { ...data, orgId });
        return res.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/email-templates`] });
      toast({
        title: "Template saved",
        description: "Your email template has been saved successfully.",
      });
      if (!params.id) {
        navigate(`/dashboard/email-builder/${data.id}`);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const addBlock = (type: EmailBlock['type']) => {
    const newBlock: EmailBlock = {
      id: `block-${Date.now()}`,
      type,
      content: type === 'text' ? 'Enter your text here...' : undefined,
      text: type === 'button' ? 'Click here' : undefined,
      url: type === 'button' || type === 'image' ? 'https://example.com' : undefined,
      alt: type === 'image' ? 'Image description' : undefined,
      level: type === 'heading' ? 1 : undefined,
      align: type === 'text' || type === 'heading' || type === 'button' ? 'left' : undefined,
      fontSize: type === 'text' ? '16px' : undefined,
      color: type === 'button' ? '#3B82F6' : undefined,
      width: type === 'image' ? '100%' : undefined,
      height: type === 'spacer' ? '20px' : undefined,
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockIndex(blocks.length);
  };
  
  const updateBlock = (index: number, updates: Partial<EmailBlock>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    setBlocks(newBlocks);
  };
  
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      setBlocks(newBlocks);
      setSelectedBlockIndex(index - 1);
    } else if (direction === 'down' && index < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      setBlocks(newBlocks);
      setSelectedBlockIndex(index + 1);
    }
  };
  
  const deleteBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
    setSelectedBlockIndex(null);
  };
  
  const selectedBlock = selectedBlockIndex !== null ? blocks[selectedBlockIndex] : null;
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild data-testid="button-back-to-templates">
              <Link href="/dashboard/email-templates">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              {params.id ? 'Edit Email Template' : 'Create Email Template'}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              data-testid="button-toggle-preview"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!templateName || !subject || saveMutation.isPending}
              data-testid="button-save-template"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Monthly Newsletter"
              data-testid="input-template-name"
            />
          </div>
          <div>
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Welcome to our community!"
              data-testid="input-subject"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="preview-text">Preview Text (optional)</Label>
            <Input
              id="preview-text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="This text appears in email previews"
              data-testid="input-preview-text"
            />
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Add Blocks</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addBlock('text')}
              data-testid="button-add-text"
            >
              <Type className="w-4 h-4 mr-2" />
              Text
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addBlock('heading')}
              data-testid="button-add-heading"
            >
              <Heading className="w-4 h-4 mr-2" />
              Heading
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addBlock('button')}
              data-testid="button-add-button"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Button
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addBlock('image')}
              data-testid="button-add-image"
            >
              <Image className="w-4 h-4 mr-2" />
              Image
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addBlock('divider')}
              data-testid="button-add-divider"
            >
              <Minus className="w-4 h-4 mr-2" />
              Divider
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addBlock('spacer')}
              data-testid="button-add-spacer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Spacer
            </Button>
          </div>
          
          <div className="mt-8">
            <h3 className="font-semibold mb-2">Merge Fields</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Use these in your content:
            </p>
            <code className="text-xs block p-2 bg-muted rounded mb-1">{'{{firstName}}'}</code>
            <code className="text-xs block p-2 bg-muted rounded mb-1">{'{{lastName}}'}</code>
            <code className="text-xs block p-2 bg-muted rounded">{'{{email}}'}</code>
          </div>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
            </CardHeader>
            <CardContent>
              {blocks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground" data-testid="text-empty-state">
                  <p>No blocks yet. Add blocks from the left sidebar to build your email.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blocks.map((block, index) => (
                    <Card
                      key={block.id}
                      className={`cursor-pointer ${selectedBlockIndex === index ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSelectedBlockIndex(index)}
                      data-testid={`block-${block.type}-${index}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium capitalize mb-1">{block.type}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {block.content || block.text || block.url || `${block.type} block`}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-4">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); moveBlock(index, 'up'); }}
                              disabled={index === 0}
                              data-testid={`button-move-up-${index}`}
                            >
                              <MoveUp className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); moveBlock(index, 'down'); }}
                              disabled={index === blocks.length - 1}
                              data-testid={`button-move-down-${index}`}
                            >
                              <MoveDown className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); deleteBlock(index); }}
                              data-testid={`button-delete-${index}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {selectedBlock && (
          <div className="w-80 border-l p-4 overflow-y-auto">
            <h3 className="font-semibold mb-4">Block Properties</h3>
            
            {selectedBlock.type === 'text' && (
              <div className="space-y-4">
                <div>
                  <Label>Content</Label>
                  <Textarea
                    value={selectedBlock.content || ''}
                    onChange={(e) => updateBlock(selectedBlockIndex!, { content: e.target.value })}
                    rows={4}
                    data-testid="input-text-content"
                  />
                </div>
                <div>
                  <Label>Alignment</Label>
                  <Select
                    value={selectedBlock.align || 'left'}
                    onValueChange={(value: any) => updateBlock(selectedBlockIndex!, { align: value })}
                  >
                    <SelectTrigger data-testid="select-text-align">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Font Size</Label>
                  <Input
                    value={selectedBlock.fontSize || '16px'}
                    onChange={(e) => updateBlock(selectedBlockIndex!, { fontSize: e.target.value })}
                    placeholder="16px"
                    data-testid="input-text-fontsize"
                  />
                </div>
              </div>
            )}
            
            {selectedBlock.type === 'heading' && (
              <div className="space-y-4">
                <div>
                  <Label>Content</Label>
                  <Input
                    value={selectedBlock.content || ''}
                    onChange={(e) => updateBlock(selectedBlockIndex!, { content: e.target.value })}
                    data-testid="input-heading-content"
                  />
                </div>
                <div>
                  <Label>Level</Label>
                  <Select
                    value={String(selectedBlock.level || 1)}
                    onValueChange={(value) => updateBlock(selectedBlockIndex!, { level: parseInt(value) })}
                  >
                    <SelectTrigger data-testid="select-heading-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Heading 1</SelectItem>
                      <SelectItem value="2">Heading 2</SelectItem>
                      <SelectItem value="3">Heading 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Alignment</Label>
                  <Select
                    value={selectedBlock.align || 'left'}
                    onValueChange={(value: any) => updateBlock(selectedBlockIndex!, { align: value })}
                  >
                    <SelectTrigger data-testid="select-heading-align">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {selectedBlock.type === 'button' && (
              <div className="space-y-4">
                <div>
                  <Label>Button Text</Label>
                  <Input
                    value={selectedBlock.text || ''}
                    onChange={(e) => updateBlock(selectedBlockIndex!, { text: e.target.value })}
                    data-testid="input-button-text"
                  />
                </div>
                <div>
                  <Label>URL</Label>
                  <Input
                    value={selectedBlock.url || ''}
                    onChange={(e) => updateBlock(selectedBlockIndex!, { url: e.target.value })}
                    data-testid="input-button-url"
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={selectedBlock.color || '#3B82F6'}
                    onChange={(e) => updateBlock(selectedBlockIndex!, { color: e.target.value })}
                    data-testid="input-button-color"
                  />
                </div>
                <div>
                  <Label>Alignment</Label>
                  <Select
                    value={selectedBlock.align || 'center'}
                    onValueChange={(value: any) => updateBlock(selectedBlockIndex!, { align: value })}
                  >
                    <SelectTrigger data-testid="select-button-align">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {selectedBlock.type === 'image' && (
              <div className="space-y-4">
                <div>
                  <Label>Image URL</Label>
                  <Input
                    value={selectedBlock.url || ''}
                    onChange={(e) => updateBlock(selectedBlockIndex!, { url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    data-testid="input-image-url"
                  />
                </div>
                <div>
                  <Label>Alt Text</Label>
                  <Input
                    value={selectedBlock.alt || ''}
                    onChange={(e) => updateBlock(selectedBlockIndex!, { alt: e.target.value })}
                    data-testid="input-image-alt"
                  />
                </div>
                <div>
                  <Label>Width</Label>
                  <Input
                    value={selectedBlock.width || '100%'}
                    onChange={(e) => updateBlock(selectedBlockIndex!, { width: e.target.value })}
                    placeholder="100%"
                    data-testid="input-image-width"
                  />
                </div>
                <div>
                  <Label>Link URL (optional)</Label>
                  <Input
                    value={selectedBlock.href || ''}
                    onChange={(e) => updateBlock(selectedBlockIndex!, { href: e.target.value })}
                    placeholder="https://example.com"
                    data-testid="input-image-href"
                  />
                </div>
              </div>
            )}
            
            {selectedBlock.type === 'spacer' && (
              <div className="space-y-4">
                <div>
                  <Label>Height</Label>
                  <Input
                    value={selectedBlock.height || '20px'}
                    onChange={(e) => updateBlock(selectedBlockIndex!, { height: e.target.value })}
                    placeholder="20px"
                    data-testid="input-spacer-height"
                  />
                </div>
              </div>
            )}
            
            {selectedBlock.type === 'divider' && (
              <div className="py-4 text-sm text-muted-foreground">
                <p>Dividers don't have customizable properties.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
