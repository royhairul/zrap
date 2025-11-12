import { InstagramProfile } from '@/types/instagram'

export async function getProfile(userid: string): Promise<InstagramProfile> {
  try {
    const url: string = 'https://www.instagram.com/graphql/query'

    const variables = { id: userid, render_surface: 'PROFILE' }

    const params = new URLSearchParams({
      doc_id: '24098904923132686',
      variables: JSON.stringify(variables),
    })

    const res = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'User-Agent': navigator.userAgent,
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Access-Control-Allow-Origin': '*',
      },
      credentials: 'include',
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch Instagram profile: ${res.status}`)
    }

    const json = await res.json()

    const rawData = json?.data?.user || json?.data?.xdt_user_by_clid?.user

    console.log('🔍 Instagram raw JSON:', json)

    if (!rawData) throw new Error('Invalid Instagram response format')

    const profile: InstagramProfile = {
      id: rawData.id,
      username: rawData.username,
      fullName: rawData.full_name,
      followers: rawData.follower_count ?? 0,
      following: rawData.following_count ?? 0,
      post_count: rawData.media_count ?? 0,
      bio: rawData.biography ?? '',
      profilePic: rawData.profile_pic_url || '',
    }

    return profile
  } catch (err) {
    console.error('InstagramService Error:', err)
    throw err // biarkan caller yang handle error
  }
}
