import mjml from 'mjml';

type EmailBlock = 
  | { type: 'text'; content: string; align?: 'left' | 'center' | 'right'; fontSize?: string; }
  | { type: 'heading'; content: string; level?: 1 | 2 | 3; align?: 'left' | 'center' | 'right'; }
  | { type: 'button'; text: string; url: string; align?: 'left' | 'center' | 'right'; color?: string; }
  | { type: 'image'; url: string; alt?: string; href?: string; width?: string; }
  | { type: 'divider'; }
  | { type: 'spacer'; height?: string; };

interface MergeFields {
  firstName?: string;
  lastName?: string;
  email: string;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// Whitelist validation functions
function validateAlign(align?: string): 'left' | 'center' | 'right' {
  const validAlignments = ['left', 'center', 'right'];
  return validAlignments.includes(align || '') ? (align as 'left' | 'center' | 'right') : 'left';
}

function validateFontSize(size?: string): string {
  // Only allow numeric values followed by px
  if (!size) return '16px';
  const match = size.match(/^(\d+)px$/);
  return match ? size : '16px';
}

function validateColor(color?: string): string {
  // Only allow hex colors
  if (!color) return '#3B82F6';
  const match = color.match(/^#[0-9A-Fa-f]{6}$/);
  return match ? color : '#3B82F6';
}

function validateWidth(width?: string): string {
  // Only allow numeric values with px or percentage
  if (!width) return '100%';
  const match = width.match(/^(\d+)(px|%)$/);
  return match ? width : '100%';
}

function validateHeight(height?: string): string {
  // Only allow numeric values with px
  if (!height) return '20px';
  const match = height.match(/^(\d+)px$/);
  return match ? height : '20px';
}

function validateUrl(url: string): string {
  // Only allow safe URL schemes: https, http, mailto, tel
  // Reject javascript:, data:, vbscript:, and other dangerous schemes
  if (!url) return '';
  
  const safeSchemes = ['https:', 'http:', 'mailto:', 'tel:'];
  try {
    const urlObj = new URL(url);
    if (safeSchemes.includes(urlObj.protocol)) {
      return escapeHtml(url);
    }
  } catch (e) {
    // If URL parsing fails, it's invalid - return empty string
  }
  
  // Invalid or dangerous URL - return empty string
  console.warn('Invalid or unsafe URL rejected:', url);
  return '';
}

function processMergeFields(text: string, mergeFields: MergeFields): string {
  // First escape the entire text to prevent XSS
  let escapedText = escapeHtml(text);
  // Then replace merge fields with escaped values
  return escapedText
    .replace(/\{\{firstName\}\}/g, escapeHtml(mergeFields.firstName || ''))
    .replace(/\{\{lastName\}\}/g, escapeHtml(mergeFields.lastName || ''))
    .replace(/\{\{email\}\}/g, escapeHtml(mergeFields.email || ''));
}

function blockToMJML(block: EmailBlock, mergeFields: MergeFields): string {
  try {
    switch (block.type) {
      case 'text': {
        const align = validateAlign(block.align);
        const fontSize = validateFontSize(block.fontSize);
        const content = processMergeFields(block.content, mergeFields);
        return `<mj-text align="${align}" font-size="${fontSize}">${content}</mj-text>`;
      }
      
      case 'heading': {
        const level = block.level || 1;
        const align = validateAlign(block.align);
        const fontSize = level === 1 ? '28px' : level === 2 ? '24px' : '20px';
        const content = processMergeFields(block.content, mergeFields);
        return `<mj-text font-size="${fontSize}" font-weight="bold" align="${align}">${content}</mj-text>`;
      }
      
      case 'button': {
        const align = validateAlign(block.align);
        const color = validateColor(block.color);
        const text = processMergeFields(block.text, mergeFields);
        const url = validateUrl(block.url);
        // If URL is invalid, skip this button block
        if (!url) return '';
        return `<mj-button href="${url}" background-color="${color}" align="${align}">${text}</mj-button>`;
      }
      
      case 'image': {
        const alt = escapeHtml(block.alt || '');
        const url = validateUrl(block.url);
        // If image URL is invalid, skip this image block
        if (!url) return '';
        const width = validateWidth(block.width);
        
        if (block.href) {
          const href = validateUrl(block.href);
          // If href is invalid, render image without link
          if (!href) {
            return `<mj-image src="${url}" alt="${alt}" width="${width}" />`;
          }
          return `<mj-image src="${url}" alt="${alt}" href="${href}" width="${width}" />`;
        } else {
          return `<mj-image src="${url}" alt="${alt}" width="${width}" />`;
        }
      }
      
      case 'divider': {
        return `<mj-divider border-color="#E5E7EB" />`;
      }
      
      case 'spacer': {
        const height = validateHeight(block.height);
        return `<mj-spacer height="${height}" />`;
      }
      
      default:
        console.warn('Unknown block type:', (block as any).type);
        return '';
    }
  } catch (error) {
    console.error('Error converting block to MJML:', error, block);
    return '';
  }
}

function buildUnsubscribeFooter(unsubscribeToken: string): string {
  const baseUrl = process.env.BASE_URL || process.env.APP_URL || 'http://localhost:5000';
  
  const unsubscribeUrl = `${baseUrl}/unsubscribe/${escapeHtml(unsubscribeToken)}`;
  
  return `
    <mj-divider border-color="#E5E7EB" padding-top="30px" />
    <mj-text font-size="12px" color="#6B7280" align="center">
      You're receiving this email because you're a member of our organization.
      <br/>
      <a href="${unsubscribeUrl}" style="color: #3B82F6;">Unsubscribe</a>
    </mj-text>
  `;
}

export async function renderEmailHTML(
  blocks: any[],
  mergeFields: MergeFields,
  unsubscribeToken: string
): Promise<string> {
  const blocksArray = Array.isArray(blocks) ? blocks : [];
  
  const blocksMJML = blocksArray
    .map((block) => blockToMJML(block, mergeFields))
    .filter((mjml) => mjml !== '')
    .join('\n');
  
  const unsubscribeFooter = buildUnsubscribeFooter(unsubscribeToken);
  
  const mjmlString = `
    <mjml>
      <mj-head>
        <mj-attributes>
          <mj-text font-family="Inter, Arial, sans-serif" />
          <mj-button font-family="Inter, Arial, sans-serif" />
        </mj-attributes>
      </mj-head>
      <mj-body>
        <mj-section>
          <mj-column>
            ${blocksMJML}
            ${unsubscribeFooter}
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `;
  
  const { html, errors } = mjml(mjmlString, {
    validationLevel: 'soft',
    minify: true,
  });
  
  if (errors && errors.length > 0) {
    console.error('MJML rendering errors:', errors);
  }
  
  return html;
}
