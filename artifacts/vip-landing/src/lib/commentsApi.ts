export interface VisitorComment {
  id: string;
  name: string;
  text: string;
  flag: string;
  initials: string;
  color: string;
  lang: string;
  likes: number;
  createdAt: string;
  isUser: true;
}

const BASE = "/api/comments";

export async function fetchComments(): Promise<VisitorComment[]> {
  try {
    const res = await fetch(BASE, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function postComment(payload: {
  name: string;
  text: string;
  flag?: string;
  initials?: string;
  color?: string;
  lang?: string;
}): Promise<VisitorComment | null> {
  try {
    const res = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
