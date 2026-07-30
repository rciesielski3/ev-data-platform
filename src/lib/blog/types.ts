export interface BlogPostMetadata {
  title: string;
  excerpt: string;
  keywords: string[];
  date: string;
  author?: string;
  slug: string;
}

export interface BlogPost extends BlogPostMetadata {
  content: string;
}

export interface BlogPostFrontmatter {
  title: string;
  excerpt: string;
  keywords: string[];
  date: string;
  author?: string;
}
