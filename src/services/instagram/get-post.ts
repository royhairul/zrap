import { InstagramPost } from '@/types/instagram'

export async function getPost(
  username: string,
  count: number = 12
): Promise<InstagramPost[]> {
  const posts: InstagramPost[] = []
  let after: string | null = null

  while (posts.length < count) {
    try {
      const url = 'https://www.instagram.com/graphql/query'
      const fetchCount = Math.min(12, count - posts.length)

      const variables: Record<string, any> = {
        data: {
          count: fetchCount,
          include_reel_media_seen_timestamp: true,
          include_relationship_info: true,
          latest_besties_reel_media: true,
          latest_reel_media: true,
        },
        username: username,
        __relay_internal__pv__PolarisIsLoggedInrelayprovider: true,
        __relay_internal__pv__PolarisShareSheetV3relayprovider: true,
      }

      if (after) variables.after = after

      const params = new URLSearchParams({
        doc_id: '24388485070759223',
        variables: JSON.stringify(variables),
      })

      const res = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'User-Agent': navigator.userAgent,
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch posts: ${res.status}`)
      }

      const json = await res.json()

      const dataBlock =
        json?.data?.xdt_api__v1__feed__user_timeline_graphql_connection ??
        json?.data?.user?.edge_owner_to_timeline_media

      const edges = dataBlock?.edges ?? []
      if (edges.length === 0) {
        console.log(`[✓] Tidak ada lagi post untuk username: ${username}`)
        break
      }

      for (const edge of edges) {
        const node = edge.node ?? {}

        const caption = node.caption?.text ?? ''
        const candidates = node.image_versions2?.candidates ?? []
        const imageUrl = candidates[0]?.url ?? ''

        const timestamp = node.taken_at
        const takenAt = timestamp
          ? new Date(timestamp * 1000)
              .toISOString()
              .replace('T', ' ')
              .slice(0, 19)
          : ''

        posts.push({
          id: node.id,
          caption,
          tags: (caption.match(/#\w+/g) || []).join(', '),
          link: `https://www.instagram.com/p/${node.code}/`,
          uploaded_at: takenAt,
          like_count: node.like_count,
          comment_count: node.comment_count,
          image_url: imageUrl,
        })
      }

      // Pagination
      const pageInfo = dataBlock?.page_info
      after = pageInfo?.end_cursor ?? null
      if (!pageInfo?.has_next_page || !after) break
    } catch (err) {
      console.error('InstagramService Error:', err)
      break
    }
  }

  return posts
}
