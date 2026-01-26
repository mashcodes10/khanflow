import { v4 as uuidv4 } from "uuid";
import { decode, encode } from "js-base64";

export function slugify(text: string): string {
  const uuid = uuidv4().replace(/\s+/g, "").slice(0, 4);

  const slug = text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  return `${slug}-${uuid}`;
}
export function encodeState(data: any): string {
  return encode(JSON.stringify(data));
}

export function decodeState(state: string): any {
  try {
    const decoded = decode(state);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding state:', error);
    console.error('State parameter:', state);
    throw new Error('Invalid state parameter');
  }
}
