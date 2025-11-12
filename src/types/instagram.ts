export interface InstagramProfile {
  id: string
  username: string
  fullName: string
  followers: number
  following: number
  bio?: string
  profilePic?: string
  category?: string

  post_count: number
  posts?: InstagramPost[]
}

export interface InstagramPost {
  id: string
  pk?: string
  link: string
  caption: string
  tags: string
  uploaded_at: string
  like_count?: number
  comment_count?: number
  image_url: string

  comments?: InstagramComment[]
}

export interface InstagramComment {
  text: string
  username: string
  createdAt: string
  likeCount: number
}
