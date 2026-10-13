export interface ChatAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  textContent?: string;
}