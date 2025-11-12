import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { getProfile, scrapeInstagram } from '@/services/instagram'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { IconListDetails, IconRefresh, IconShovel } from '@tabler/icons-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { toast } from 'sonner'

export default function App() {
  const [userId, setUserId] = useState<string | null>(null)
  const [targetUserId, setTargetUserId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [selectedNumber, setSelectedNumber] = useState<number>(10)
  const [profilePic, setProfilePic] = useState<string | null>(null)

  // ✅ Ambil userId dari cookie Instagram (akun login)
  useEffect(() => {
    async function fetchInstagramUserId() {
      try {
        const response = await new Promise<{ userId: string | null }>(
          (resolve) => {
            chrome.runtime.sendMessage(
              { type: 'GET_INSTAGRAM_COOKIE_USER_ID' },
              (response) => resolve(response ?? { userId: null })
            )
          }
        )
        setUserId(response.userId)
      } catch (err) {
        console.error('Gagal mengambil userId login:', err)
      }
    }

    fetchInstagramUserId()
  }, [])

  const fetchImageAsDataUrl = useCallback(
    (url: string): Promise<string | null> => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'FETCH_IMAGE', url }, (response) =>
          resolve(response?.dataUrl ?? null)
        )
      })
    },
    []
  )

  // ✅ Fungsi ambil target userId dari halaman aktif
  const fetchTargetUserId = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      if (!tab?.id) return

      const response = await new Promise((resolve) => {
        chrome.tabs.sendMessage(
          tab.id!,
          { type: 'GET_USER_ID_FROM_PAGE' },
          (res) => resolve(res?.userId ?? null)
        )
      })

      console.log('Target userId:', response)
      setTargetUserId(response as string | null)
    } catch (err) {
      console.error('Gagal mengambil target userId:', err)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // ✅ Jalankan sekali di awal
  useEffect(() => {
    fetchTargetUserId()
  }, [fetchTargetUserId])

  // ✅ Profil akun login
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useQuery({
    queryKey: ['instagramProfile', userId],
    queryFn: () => getProfile(userId ?? ''),
    enabled: !!userId,
  })

  // ✅ Profil akun yang sedang dikunjungi
  const {
    data: targetProfile,
    isLoading: isTargetLoading,
    isError: isTargetError,
  } = useQuery({
    queryKey: ['targetProfile', targetUserId],
    queryFn: () => getProfile(targetUserId ?? ''),
    enabled: !!targetUserId,
  })

  // ✅ Ambil foto profil target saat data berubah
  useEffect(() => {
    async function loadProfilePic() {
      if (targetProfile?.profilePic) {
        const dataUrl = await fetchImageAsDataUrl(targetProfile.profilePic)
        setProfilePic(dataUrl)
      }
    }
    loadProfilePic()
  }, [targetProfile, fetchImageAsDataUrl])

  return (
    <div className="w-full p-5 flex flex-col items-start gap-5">
      {/* Tombol refresh di pojok kanan atas */}
      <div className="self-end flex">
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchTargetUserId}
          disabled={isRefreshing}
        >
          <IconRefresh
            className={`h-5 w-5 ${
              isRefreshing ? 'animate-spin text-blue-500' : ''
            }`}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => chrome.runtime.openOptionsPage()}
          disabled={isRefreshing}
        >
          <IconListDetails className="h-5 w-5" />
        </Button>
      </div>

      {/* Profile Login */}
      <div className="flex flex-col gap-1 w-full">
        {!userId ? (
          <Skeleton className="h-4 w-32" />
        ) : isProfileLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : isProfileError ? (
          <p className="text-sm text-red-500">Gagal memuat profil login.</p>
        ) : (
          <>
            <p className="text-sm">Welcome to Instagram</p>
            <h1 className="text-lg font-semibold">
              {profile?.fullName ?? 'Unknown User'}
            </h1>
            <h1 className="text-sm">@{profile?.username ?? 'unknown'}</h1>
          </>
        )}
      </div>

      {/* Card Target Visit */}
      {targetUserId && (
        <Card className="w-full">
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-xs font-medium">Anda Sedang Mengunjungi</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!targetProfile)
                      return toast.error('Tidak ada profil untuk disimpan.')

                    try {
                      const { profiles = [] } = await chrome.storage.local.get(
                        'profiles'
                      )

                      const newProfiles = [
                        ...profiles,
                        {
                          ...targetProfile,
                          scrapedAt: new Date().toISOString(),
                        },
                      ]

                      await chrome.storage.local.set({ profiles: newProfiles })

                      toast.success(
                        `Profil ${targetProfile.username} berhasil disimpan!`
                      )
                    } catch (err) {
                      console.error('Gagal menyimpan profil:', err)
                      toast.error('Gagal menyimpan profil')
                    }
                  }}
                >
                  <IconShovel />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Scrape Profile</p>
              </TooltipContent>
            </Tooltip>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {isTargetLoading ? (
              <Skeleton className="h-16 w-16 rounded-full" />
            ) : isTargetError ? (
              <p className="text-sm text-red-500">
                Gagal memuat profil target.
              </p>
            ) : (
              <>
                {/* ✅ Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profilePic ?? ''} />
                    <AvatarFallback>
                      {targetProfile?.username?.charAt(0)?.toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h1 className="text-lg font-semibold">
                      {targetProfile?.fullName ?? 'Nama tidak tersedia'}
                    </h1>
                    <h1 className="text-sm text-gray-500">
                      @{targetProfile?.username ?? 'unknown'}
                    </h1>
                  </div>
                </div>

                {/* Statistik */}
                <div className="flex justify-between text-center mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Post</p>
                    <h3 className="font-semibold text-base">
                      {targetProfile?.post_count ?? 0}
                    </h3>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Follower</p>
                    <h3 className="font-semibold text-base">
                      {targetProfile?.followers ?? 0}
                    </h3>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Following</p>
                    <h3 className="font-semibold text-base">
                      {targetProfile?.following ?? 0}
                    </h3>
                  </div>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="w-full flex gap-4 cursor-pointer">
            <Select
              onValueChange={(value) => setSelectedNumber(Number(value))}
              value={selectedNumber?.toString() ?? ''}
            >
              <SelectTrigger className="w-full sm:w-1/3">
                <SelectValue placeholder="Pilih jumlah post" />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} Posts
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={async () => {
                if (!targetProfile) {
                  toast.error('Tidak ada profil target.')
                  return
                }

                try {
                  toast.loading('Mengambil postingan...')

                  const data = await scrapeInstagram(
                    targetProfile.id,
                    selectedNumber,
                    1000
                  )

                  const { scrapedProfile = [] } =
                    await chrome.storage.local.get('scrapedProfile')

                  const newData = [
                    ...scrapedProfile,
                    { ...data, scrapedAt: new Date().toISOString() },
                  ]

                  await chrome.storage.local.set({ scrapedProfile: newData })

                  toast.dismiss()
                  toast.success(
                    `Berhasil menyimpan ${
                      data?.posts?.length ?? 0
                    } postingan + komentar dari @${targetProfile.username}`
                  )
                  console.log('✅ Scraped posts saved:', newData)
                } catch (err) {
                  toast.dismiss()
                  console.error('❌ Gagal menyimpan postingan:', err)
                  toast.error('Gagal menyimpan postingan.')
                }
              }}
              variant="default"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Scrape it!
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
