import { delay } from '@/lib/utils'
import { InstagramComment } from '@/types/instagram'

export async function getComment(
  postId: string,
  limit: number = 50
): Promise<InstagramComment[]> {
  const url = `https://www.instagram.com/api/v1/media/${postId}/comments/`

  const headers: Record<string, string> = {
    'User-Agent': 'Instagram 219.0.0.12.117 Android',
    Accept: 'application/json',
  }

  const allComments: InstagramComment[] = []
  let nextMinId: string | null = null

  while (true) {
    try {
      const params = new URLSearchParams({
        can_support_threading: 'true',
        permalink_enabled: 'false',
      })

      if (nextMinId) params.set('min_id', nextMinId)

      const response = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
        headers,
        credentials: 'include',
      })

      if (!response.ok) {
        console.warn(`⚠️ Gagal mengambil komentar (status: ${response.status})`)
        break
      }

      const data = await response.json()

      const comments = (data?.comments ?? []).map((comment: any) => {
        const timestamp = comment.created_at
        const createdAt = timestamp
          ? new Date(timestamp * 1000)
              .toISOString()
              .replace('T', ' ')
              .split('.')[0]
          : ''

        return {
          text: comment.text ?? '',
          username: comment.user?.username ?? 'unknown',
          createdAt,
          likeCount: comment.comment_like_count ?? 0,
        } satisfies InstagramComment
      })

      allComments.push(...comments)

      if (allComments.length >= limit) {
        allComments.length = limit
        break
      }

      nextMinId = data.next_min_id ?? null
      if (!nextMinId) break

      await delay(800)
    } catch (err) {
      console.error('❌ InstagramCommentService Error:', err)
      break
    }
  }

  return allComments
}
