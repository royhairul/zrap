import { getProfile } from './get-profile'
import { getPost } from './get-post'
import { getComment } from './get-comment'
import { InstagramPost, InstagramProfile } from '@/types/instagram'

export async function scrapeInstagram(
  userid: string,
  post_limit: number = 20,
  comment_limit: number = 20
): Promise<InstagramProfile> {
  const profile = await getProfile(userid)
  console.log('✅ Profil berhasil diambil:', {
    username: profile.username,
    fullName: profile.fullName,
  })

  const posts = await getPost(profile.username, post_limit)
  const nestedPosts: InstagramPost[] = []

  for (const [i, post] of posts.entries()) {
    console.log(
      `\n➡️ [${i + 1}/${posts.length}] Ambil komentar untuk post ID: ${post.id}`
    )

    try {
      const comments = await getComment(post.id, comment_limit)
      console.log(`💬 Jumlah komentar (${post.id}): ${comments?.length ?? 0}`)

      nestedPosts.push({
        ...post,
        comments,
      })
    } catch (err) {
      console.error(`❌ Error ambil komentar untuk post ${post.id}:`, err)
    }
  }

  console.log('✅ Semua komentar selesai diambil')
  profile.posts = nestedPosts

  return profile
}
