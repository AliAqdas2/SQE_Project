import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Type, 
  Heading1,
  Heading2,
  Image as ImageIcon, 
  Video, 
  Layout, 
  Columns,
  GripVertical,
  Edit,
  Code2,
  Share2,
  HelpCircle,
  MessageSquareQuote,
  MousePointerClick
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/image-upload";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Facebook, Twitter, Linkedin, Mail } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';

// Discriminated union types for all page components
type BaseComponent = {
  id: string;
};

export type SectionComponent = BaseComponent & {
  type: "section";
  children: PageComponent[];
};

export type RowComponent = BaseComponent & {
  type: "row";
  columnCount: number;
  children: ColumnComponent[];
};

export type ColumnComponent = BaseComponent & {
  type: "column";
  children: ContentComponent[];
};

export type HeaderComponent = BaseComponent & {
  type: "header";
  content: string;
};

export type SubHeaderComponent = BaseComponent & {
  type: "subheader";
  content: string;
  size: "h3" | "h4" | "h5";
};

export type TextComponent = BaseComponent & {
  type: "text";
  content: string;
};

export type ImageComponent = BaseComponent & {
  type: "image";
  url: string;
};

export type VideoComponent = BaseComponent & {
  type: "video";
  url: string;
};

export type ButtonComponent = BaseComponent & {
  type: "button";
  buttonText: string;
  buttonUrl: string;
  buttonStyle: "primary" | "secondary" | "outline";
  buttonSize: "default" | "sm" | "lg";
};

export type CodeBlockComponent = BaseComponent & {
  type: "codeblock";
  code: string;
  language: string;
};

export type SocialShareComponent = BaseComponent & {
  type: "socialshare";
  platforms: {
    facebook: boolean;
    twitter: boolean;
    linkedin: boolean;
    email: boolean;
    whatsapp: boolean;
  };
  shareUrl?: string;
  shareText?: string;
};

export type FaqComponent = BaseComponent & {
  type: "faq";
  items: Array<{
    question: string;
    answer: string;
  }>;
};

export type TestimonialComponent = BaseComponent & {
  type: "testimonial";
  quote: string;
  author: string;
  role: string;
  avatarUrl?: string;
};

export type ContentComponent = 
  | HeaderComponent 
  | SubHeaderComponent
  | TextComponent 
  | ImageComponent 
  | VideoComponent 
  | ButtonComponent
  | CodeBlockComponent
  | SocialShareComponent
  | FaqComponent
  | TestimonialComponent;

export type PageComponent = 
  | SectionComponent 
  | RowComponent 
  | ColumnComponent 
  | ContentComponent;

interface PageBuilderProps {
  components: PageComponent[];
  onChange: (components: PageComponent[]) => void;
}

// Component Registry Entry Type
type ComponentRegistryEntry<T extends ContentComponent> = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  createDefault: () => T;
  renderPreview: (component: T) => React.ReactNode;
  renderEditor: (component: T, onChange: (updated: T) => void) => React.ReactNode;
};

// Component Registry - fully registry-driven with render functions
const CONTENT_COMPONENT_REGISTRY: {
  [K in ContentComponent['type']]: ComponentRegistryEntry<Extract<ContentComponent, { type: K }>>;
} = {
  header: {
    icon: Type,
    label: "Header",
    createDefault: (): HeaderComponent => ({
      id: `header-${Date.now()}`,
      type: "header",
      content: "New Heading",
    }),
    renderPreview: (comp) => (
      <h2 className="text-3xl font-bold">{comp.content}</h2>
    ),
    renderEditor: (comp, onChange) => (
      <div className="space-y-2">
        <Label>Heading Text</Label>
        <Input
          value={comp.content}
          onChange={(e) => onChange({ ...comp, content: e.target.value })}
          data-testid="input-header-content"
        />
      </div>
    ),
  },
  subheader: {
    icon: Heading2,
    label: "Sub-Header",
    createDefault: (): SubHeaderComponent => ({
      id: `subheader-${Date.now()}`,
      type: "subheader",
      content: "Sub Heading",
      size: "h3",
    }),
    renderPreview: (comp) => {
      const sizeClasses = {
        h3: "text-2xl",
        h4: "text-xl",
        h5: "text-lg",
      };
      const Tag = comp.size;
      return <Tag className={`font-semibold ${sizeClasses[comp.size]}`}>{comp.content}</Tag>;
    },
    renderEditor: (comp, onChange) => (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Sub-Header Text</Label>
          <Input
            value={comp.content}
            onChange={(e) => onChange({ ...comp, content: e.target.value })}
            data-testid="input-subheader-content"
          />
        </div>
        <div className="space-y-2">
          <Label>Size</Label>
          <Select value={comp.size} onValueChange={(value: "h3" | "h4" | "h5") => onChange({ ...comp, size: value })}>
            <SelectTrigger data-testid="select-subheader-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="h3">H3 (Large)</SelectItem>
              <SelectItem value="h4">H4 (Medium)</SelectItem>
              <SelectItem value="h5">H5 (Small)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    ),
  },
  text: {
    icon: Type,
    label: "Text",
    createDefault: (): TextComponent => ({
      id: `text-${Date.now()}`,
      type: "text",
      content: "Add your text here...",
    }),
    renderPreview: (comp) => <p className="text-foreground">{comp.content}</p>,
    renderEditor: (comp, onChange) => (
      <div className="space-y-2">
        <Label>Text Content</Label>
        <Textarea
          value={comp.content}
          onChange={(e) => onChange({ ...comp, content: e.target.value })}
          rows={4}
          data-testid="input-text-content"
        />
      </div>
    ),
  },
  image: {
    icon: ImageIcon,
    label: "Image",
    createDefault: (): ImageComponent => ({
      id: `image-${Date.now()}`,
      type: "image",
      url: "https://via.placeholder.com/800x400",
    }),
    renderPreview: (comp) => (
      <img src={comp.url} alt="Campaign content" className="w-full rounded-md" />
    ),
    renderEditor: (comp, onChange) => (
      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input
          type="url"
          value={comp.url}
          onChange={(e) => onChange({ ...comp, url: e.target.value })}
          placeholder="https://example.com/image.jpg"
          data-testid="input-image-url"
        />
        {comp.url && (
          <div className="mt-2 p-4 border rounded-md">
            <img src={comp.url} alt="Preview" className="max-w-full h-auto rounded" />
          </div>
        )}
      </div>
    ),
  },
  video: {
    icon: Video,
    label: "Video",
    createDefault: (): VideoComponent => ({
      id: `video-${Date.now()}`,
      type: "video",
      url: "",
    }),
    renderPreview: (comp) => (
      <div className="aspect-video">
        <iframe
          src={comp.url}
          className="w-full h-full rounded-md"
          allowFullScreen
        />
      </div>
    ),
    renderEditor: (comp, onChange) => (
      <div className="space-y-2">
        <Label>Video Embed URL</Label>
        <Input
          type="url"
          value={comp.url}
          onChange={(e) => onChange({ ...comp, url: e.target.value })}
          placeholder="https://youtube.com/embed/..."
          data-testid="input-video-url"
        />
      </div>
    ),
  },
  button: {
    icon: MousePointerClick,
    label: "Button",
    createDefault: (): ButtonComponent => ({
      id: `button-${Date.now()}`,
      type: "button",
      buttonText: "Click Here",
      buttonUrl: "#",
      buttonStyle: "primary",
      buttonSize: "default",
    }),
    renderPreview: (comp) => {
      const variantMap = {
        primary: "default" as const,
        secondary: "secondary" as const,
        outline: "outline" as const,
      };
      const sizeMap = {
        sm: "sm" as const,
        default: "default" as const,
        lg: "lg" as const,
      };
      return (
        <Button
          variant={variantMap[comp.buttonStyle]}
          size={sizeMap[comp.buttonSize]}
          asChild
        >
          <a href={comp.buttonUrl}>{comp.buttonText}</a>
        </Button>
      );
    },
    renderEditor: (comp, onChange) => (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Button Text</Label>
          <Input
            value={comp.buttonText}
            onChange={(e) => onChange({ ...comp, buttonText: e.target.value })}
            data-testid="input-button-text"
          />
        </div>
        <div className="space-y-2">
          <Label>Button URL</Label>
          <Input
            type="url"
            value={comp.buttonUrl}
            onChange={(e) => onChange({ ...comp, buttonUrl: e.target.value })}
            placeholder="https://..."
            data-testid="input-button-url"
          />
        </div>
        <div className="space-y-2">
          <Label>Style</Label>
          <Select value={comp.buttonStyle} onValueChange={(value: "primary" | "secondary" | "outline") => onChange({ ...comp, buttonStyle: value })}>
            <SelectTrigger data-testid="select-button-style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Size</Label>
          <Select value={comp.buttonSize} onValueChange={(value: "sm" | "default" | "lg") => onChange({ ...comp, buttonSize: value })}>
            <SelectTrigger data-testid="select-button-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    ),
  },
  codeblock: {
    icon: Code2,
    label: "Code Block",
    createDefault: (): CodeBlockComponent => ({
      id: `codeblock-${Date.now()}`,
      type: "codeblock",
      code: "// Your code here",
      language: "javascript",
    }),
    renderPreview: (comp) => (
      <div className="rounded-md overflow-hidden">
        <SyntaxHighlighter language={comp.language} style={vscDarkPlus}>
          {comp.code}
        </SyntaxHighlighter>
      </div>
    ),
    renderEditor: (comp, onChange) => (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Code</Label>
          <Textarea
            value={comp.code}
            onChange={(e) => onChange({ ...comp, code: e.target.value })}
            rows={8}
            className="font-mono text-sm"
            data-testid="input-code-content"
          />
        </div>
        <div className="space-y-2">
          <Label>Language</Label>
          <Select value={comp.language} onValueChange={(value: CodeBlockComponent["language"]) => onChange({ ...comp, language: value })}>
            <SelectTrigger data-testid="select-code-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="css">CSS</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="bash">Bash</SelectItem>
              <SelectItem value="sql">SQL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    ),
  },
  socialshare: {
    icon: Share2,
    label: "Social Share",
    createDefault: (): SocialShareComponent => ({
      id: `socialshare-${Date.now()}`,
      type: "socialshare",
      platforms: {
        facebook: true,
        twitter: true,
        linkedin: false,
        email: false,
        whatsapp: false,
      },
      shareText: "Check this out!",
    }),
    renderPreview: (comp) => {
      const shareUrl = comp.shareUrl || window.location.href;
      const text = encodeURIComponent(comp.shareText || "");
      const url = encodeURIComponent(shareUrl);
      
      return (
        <div className="flex gap-2 items-center">
          {comp.platforms.facebook && (
            <Button size="icon" variant="outline" asChild>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${url}`} target="_blank" rel="noopener noreferrer">
                <Facebook className="h-4 w-4" />
              </a>
            </Button>
          )}
          {comp.platforms.twitter && (
            <Button size="icon" variant="outline" asChild>
              <a href={`https://twitter.com/intent/tweet?text=${text}&url=${url}`} target="_blank" rel="noopener noreferrer">
                <Twitter className="h-4 w-4" />
              </a>
            </Button>
          )}
          {comp.platforms.linkedin && (
            <Button size="icon" variant="outline" asChild>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`} target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-4 w-4" />
              </a>
            </Button>
          )}
          {comp.platforms.email && (
            <Button size="icon" variant="outline" asChild>
              <a href={`mailto:?subject=${text}&body=${url}`}>
                <Mail className="h-4 w-4" />
              </a>
            </Button>
          )}
          {comp.platforms.whatsapp && (
            <Button size="icon" variant="outline" asChild>
              <a href={`https://wa.me/?text=${text}%20${url}`} target="_blank" rel="noopener noreferrer">
                <SiWhatsapp className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      );
    },
    renderEditor: (comp, onChange) => (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Share Text</Label>
          <Input
            value={comp.shareText || ""}
            onChange={(e) => onChange({ ...comp, shareText: e.target.value })}
            placeholder="Check this out!"
            data-testid="input-share-text"
          />
        </div>
        <div className="space-y-2">
          <Label>Share URL (optional)</Label>
          <Input
            type="url"
            value={comp.shareUrl || ""}
            onChange={(e) => onChange({ ...comp, shareUrl: e.target.value })}
            placeholder="https://..."
            data-testid="input-share-url"
          />
        </div>
        <div className="space-y-3">
          <Label>Platforms</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-normal">Facebook</Label>
              <Switch
                checked={comp.platforms.facebook}
                onCheckedChange={(checked) => onChange({ ...comp, platforms: { ...comp.platforms, facebook: checked } })}
                data-testid="switch-platform-facebook"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-normal">Twitter</Label>
              <Switch
                checked={comp.platforms.twitter}
                onCheckedChange={(checked) => onChange({ ...comp, platforms: { ...comp.platforms, twitter: checked } })}
                data-testid="switch-platform-twitter"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-normal">LinkedIn</Label>
              <Switch
                checked={comp.platforms.linkedin}
                onCheckedChange={(checked) => onChange({ ...comp, platforms: { ...comp.platforms, linkedin: checked } })}
                data-testid="switch-platform-linkedin"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-normal">Email</Label>
              <Switch
                checked={comp.platforms.email}
                onCheckedChange={(checked) => onChange({ ...comp, platforms: { ...comp.platforms, email: checked } })}
                data-testid="switch-platform-email"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-normal">WhatsApp</Label>
              <Switch
                checked={comp.platforms.whatsapp}
                onCheckedChange={(checked) => onChange({ ...comp, platforms: { ...comp.platforms, whatsapp: checked } })}
                data-testid="switch-platform-whatsapp"
              />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  faq: {
    icon: HelpCircle,
    label: "FAQ",
    createDefault: (): FaqComponent => ({
      id: `faq-${Date.now()}`,
      type: "faq",
      items: [
        { question: "Question 1?", answer: "Answer 1" },
        { question: "Question 2?", answer: "Answer 2" },
      ],
    }),
    renderPreview: (comp) => (
      <Accordion type="single" collapsible className="w-full">
        {comp.items.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    ),
    renderEditor: (comp, onChange) => (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>FAQ Items</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...comp, items: [...comp.items, { question: "New Question?", answer: "New Answer" }] })}
            data-testid="button-add-faq"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add FAQ
          </Button>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comp.items.map((item, index) => (
            <Card key={index}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">FAQ {index + 1}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onChange({ ...comp, items: comp.items.filter((_, i) => i !== index) })}
                    data-testid={`button-remove-faq-${index}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Question</Label>
                  <Input
                    value={item.question}
                    onChange={(e) => {
                      const newItems = [...comp.items];
                      newItems[index] = { ...newItems[index], question: e.target.value };
                      onChange({ ...comp, items: newItems });
                    }}
                    data-testid={`input-faq-question-${index}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Answer</Label>
                  <Textarea
                    value={item.answer}
                    onChange={(e) => {
                      const newItems = [...comp.items];
                      newItems[index] = { ...newItems[index], answer: e.target.value };
                      onChange({ ...comp, items: newItems });
                    }}
                    rows={3}
                    data-testid={`input-faq-answer-${index}`}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    ),
  },
  testimonial: {
    icon: MessageSquareQuote,
    label: "Testimonial",
    createDefault: (): TestimonialComponent => ({
      id: `testimonial-${Date.now()}`,
      type: "testimonial",
      quote: "This made a huge difference in our organization!",
      author: "John Doe",
      role: "Director",
    }),
    renderPreview: (comp) => (
      <Card>
        <CardContent className="p-6 space-y-4">
          <p className="italic text-lg">"{comp.quote}"</p>
          <div className="flex items-center gap-3">
            {comp.avatarUrl && (
              <img src={comp.avatarUrl} alt={comp.author} className="w-12 h-12 rounded-full" />
            )}
            <div>
              <p className="font-semibold">{comp.author}</p>
              <p className="text-sm text-muted-foreground">{comp.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    renderEditor: (comp, onChange) => (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Quote</Label>
          <Textarea
            value={comp.quote}
            onChange={(e) => onChange({ ...comp, quote: e.target.value })}
            rows={4}
            data-testid="input-testimonial-quote"
          />
        </div>
        <div className="space-y-2">
          <Label>Author Name</Label>
          <Input
            value={comp.author}
            onChange={(e) => onChange({ ...comp, author: e.target.value })}
            data-testid="input-testimonial-author"
          />
        </div>
        <div className="space-y-2">
          <Label>Role/Title</Label>
          <Input
            value={comp.role}
            onChange={(e) => onChange({ ...comp, role: e.target.value })}
            data-testid="input-testimonial-role"
          />
        </div>
        <div className="space-y-2">
          <Label>Avatar URL (optional)</Label>
          <Input
            type="url"
            value={comp.avatarUrl || ""}
            onChange={(e) => onChange({ ...comp, avatarUrl: e.target.value })}
            placeholder="https://example.com/avatar.jpg"
            data-testid="input-testimonial-avatar"
          />
          {comp.avatarUrl && (
            <div className="mt-2">
              <img src={comp.avatarUrl} alt="Avatar preview" className="w-16 h-16 rounded-full" />
            </div>
          )}
        </div>
      </div>
    ),
  },
};

export function CampaignPageBuilder({ components, onChange }: PageBuilderProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<PageComponent | null>(null);
  const [selectedPath, setSelectedPath] = useState<number[]>([]);

  // Helper to get component at path
  const getComponentAtPath = (path: number[]): PageComponent | null => {
    let current: any = components;
    let component: PageComponent | null = null;
    
    for (let i = 0; i < path.length; i++) {
      component = current[path[i]];
      if (!component) return null;
      if (i < path.length - 1) {
        current = (component as any).children || [];
      }
    }
    return component;
  };

  // Helper to update component at path
  const updateAtPath = (path: number[], updates: any) => {
    const newComponents = JSON.parse(JSON.stringify(components)) as PageComponent[];
    let current: any = newComponents;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]].children;
    }
    current[path[path.length - 1]] = { ...current[path[path.length - 1]], ...updates };
    onChange(newComponents);
  };

  // Helper to remove component at path
  const removeAtPath = (path: number[]) => {
    const newComponents = JSON.parse(JSON.stringify(components)) as PageComponent[];
    let current: any = newComponents;
    let parent: any = null;
    
    for (let i = 0; i < path.length - 1; i++) {
      parent = current[path[i]];
      current = current[path[i]].children;
    }
    current.splice(path[path.length - 1], 1);
    
    // Update parent row's columnCount if removing a column
    if (parent && parent.type === "row") {
      parent.columnCount = parent.children.length;
    }
    
    onChange(newComponents);
  };

  // Helper to move component at path
  const moveAtPath = (path: number[], direction: "up" | "down") => {
    const newComponents = JSON.parse(JSON.stringify(components)) as PageComponent[];
    let current: any = newComponents;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]].children;
    }
    
    const index = path[path.length - 1];
    if ((direction === "up" && index === 0) || (direction === "down" && index === current.length - 1)) {
      return;
    }
    
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [current[index], current[targetIndex]] = [current[targetIndex], current[index]];
    onChange(newComponents);
  };

  const addSection = () => {
    const newSection: PageComponent = {
      id: `section-${Date.now()}`,
      type: "section",
      children: [],
    };
    onChange([...components, newSection]);
    setAddDialogOpen(false);
  };

  const addRowToSection = (sectionIndex: number) => {
    const newComponents: any = JSON.parse(JSON.stringify(components));
    const newRow = {
      id: `row-${Date.now()}`,
      type: "row" as const,
      columnCount: 1,
      children: [{
        id: `column-${Date.now()}`,
        type: "column" as const,
        children: [],
      }],
    };
    newComponents[sectionIndex].children.push(newRow);
    onChange(newComponents);
  };

  const addColumnToRow = (path: number[]) => {
    const row = getComponentAtPath(path);
    if (row && row.type === "row") {
      const newColumn = {
        id: `column-${Date.now()}`,
        type: "column" as const,
        children: [],
      };
      const newChildren = [...(row.children || []), newColumn];
      updateAtPath(path, {
        columnCount: newChildren.length,
        children: newChildren,
      });
    }
  };

  const addContentToColumn = (path: number[], contentType: ContentComponent["type"]) => {
    const registry = CONTENT_COMPONENT_REGISTRY[contentType];
    if (!registry) return;
    
    const newContent = registry.createDefault();
    const column = getComponentAtPath(path);
    if (column && column.type === "column") {
      updateAtPath(path, {
        children: [...(column.children || []), newContent],
      });
    }
  };

  const renderComponentIcon = (type: PageComponent["type"]) => {
    if (type === "section") return <Layout className="h-4 w-4" />;
    if (type === "row") return <Columns className="h-4 w-4" />;
    if (type === "column") return <GripVertical className="h-4 w-4" />;
    
    const registry = CONTENT_COMPONENT_REGISTRY[type];
    if (registry) {
      const Icon = registry.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <Type className="h-4 w-4" />;
  };

  // Render live preview of a component - REGISTRY-DRIVEN
  const renderPreview = (component: PageComponent): JSX.Element => {
    // Handle structural components (tree-aware logic stays outside registry)
    if (component.type === "section") {
      return (
        <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 mb-4 bg-card">
          {component.children && component.children.length > 0 ? (
            component.children.map((child) => renderPreview(child))
          ) : (
            <div className="text-center text-sm text-muted-foreground py-8">
              Empty section - add rows to get started
            </div>
          )}
        </div>
      );
    }
    
    if (component.type === "row") {
      return (
        <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `repeat(${component.columnCount}, 1fr)` }}>
          {component.children?.map((child) => renderPreview(child))}
        </div>
      );
    }
    
    if (component.type === "column") {
      return (
        <div className="border border-border rounded-md p-4 min-h-[100px] bg-background">
          {component.children && component.children.length > 0 ? (
            component.children.map((child) => renderPreview(child))
          ) : (
            <div className="text-center text-sm text-muted-foreground py-4">
              Empty column
            </div>
          )}
        </div>
      );
    }
    
    // Delegate to registry for content components
    const registry = CONTENT_COMPONENT_REGISTRY[component.type];
    if (!registry) {
      console.warn(`Unknown component type: ${component.type}`);
      return (
        <div className="mb-4 p-4 border-2 border-destructive rounded-md bg-destructive/10">
          <p className="text-sm text-destructive">Unknown component: {component.type}</p>
        </div>
      );
    }
    
    // Wrap registry-rendered content with consistent vertical spacing
    return <div className="mb-4">{registry.renderPreview(component)}</div>;
  };

  // Render component tree editor
  const renderComponentTree = (comps: PageComponent[], path: number[] = []) => {
    return comps.map((component, index) => {
      const currentPath = [...path, index];
      const isSection = component.type === "section";
      const isRow = component.type === "row";
      const isColumn = component.type === "column";
      const isContent = !isSection && !isRow && !isColumn;

      return (
        <div key={component.id} className="space-y-2">
          <Card className="overflow-hidden">
            <CardContent className={`p-3 ${isSection ? 'bg-primary/5' : isRow ? 'bg-secondary/20' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {renderComponentIcon(component.type)}
                  <div>
                    <div className="font-medium capitalize text-sm">{component.type}</div>
                    {'content' in component && component.content && (
                      <div className="text-xs text-muted-foreground truncate max-w-xs">
                        {component.content.substring(0, 40)}
                        {component.content.length > 40 && "..."}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isSection && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addRowToSection(index)}
                      data-testid={`button-add-row-${component.id}`}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Row
                    </Button>
                  )}
                  {isRow && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addColumnToRow(currentPath)}
                      data-testid={`button-add-column-${component.id}`}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Column
                    </Button>
                  )}
                  {isColumn && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" data-testid={`button-add-content-${component.id}`}>
                          <Plus className="h-3 w-3 mr-1" />
                          Content
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add Content</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-3 gap-3">
                          {(Object.keys(CONTENT_COMPONENT_REGISTRY) as Array<keyof typeof CONTENT_COMPONENT_REGISTRY>).map((type) => {
                            const { icon: Icon, label } = CONTENT_COMPONENT_REGISTRY[type];
                            return (
                              <Button
                                key={type}
                                variant="outline"
                                className="h-20 flex-col"
                                onClick={() => addContentToColumn(currentPath, type)}
                                data-testid={`button-add-${type}`}
                              >
                                <Icon className="h-5 w-5" />
                                <span className="mt-2 text-xs">{label}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {isContent && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingComponent(component)}
                      data-testid={`button-edit-${component.id}`}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveAtPath(currentPath, "up")}
                    disabled={index === 0}
                  >
                    <MoveUp className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveAtPath(currentPath, "down")}
                    disabled={index === comps.length - 1}
                  >
                    <MoveDown className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAtPath(currentPath)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {'children' in component && component.children && component.children.length > 0 && (
            <div className="ml-6 border-l-2 border-border pl-4 space-y-2">
              {renderComponentTree(component.children as PageComponent[], currentPath)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel - Component Tree */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Page Structure</h3>
          <Button size="sm" onClick={addSection} data-testid="button-add-section">
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>

        {components.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-sm mb-4">
                No sections added yet. Click "Add Section" to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {renderComponentTree(components)}
          </div>
        )}
      </div>

      {/* Right Panel - Live Preview */}
      <div className="space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {components.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                Your page preview will appear here as you build
              </div>
            ) : (
              <div className="space-y-4">
                {components.map((component) => (
                  <div key={component.id}>{renderPreview(component)}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Component Dialog */}
      <Dialog open={!!editingComponent} onOpenChange={(open) => !open && setEditingComponent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editingComponent?.type}</DialogTitle>
          </DialogHeader>
          {editingComponent && (
            <div className="space-y-4">
              {/* REGISTRY-DRIVEN EDITOR */}
              {editingComponent.type !== "section" && editingComponent.type !== "row" && editingComponent.type !== "column" ? (
                <>
                  {(() => {
                    const registry = CONTENT_COMPONENT_REGISTRY[editingComponent.type];
                    if (!registry) {
                      console.warn(`No registry entry for component type: ${editingComponent.type}`);
                      return (
                        <div className="p-4 border-2 border-destructive rounded-md bg-destructive/10">
                          <p className="text-sm text-destructive">
                            Cannot edit unknown component type: {editingComponent.type}
                          </p>
                        </div>
                      );
                    }
                    return registry.renderEditor(editingComponent, setEditingComponent);
                  })()}
                </>
              ) : (
                <div className="p-4 border rounded-md bg-muted">
                  <p className="text-sm text-muted-foreground">
                    Structural components (sections, rows, columns) are not directly editable.
                    Modify their contents instead.
                  </p>
                </div>
              )}

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingComponent(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  const findAndUpdate = (comps: any[], target: PageComponent): any[] => {
                    return comps.map(c => {
                      if (c.id === target.id) {
                        return editingComponent;
                      }
                      if ('children' in c && c.children) {
                        return { ...c, children: findAndUpdate(c.children, target) };
                      }
                      return c;
                    });
                  };
                  onChange(findAndUpdate(components as any[], editingComponent));
                  setEditingComponent(null);
                }} data-testid="button-save-component">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
