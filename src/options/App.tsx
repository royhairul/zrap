import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import * as XLSX from 'xlsx'
import {
  IconChevronDown,
  IconChevronUp,
  IconListDetails,
  IconMessageCircle,
  IconDownload,
} from '@tabler/icons-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function App() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string[]>([])
  const [previewModes, setPreviewModes] = useState<
    Record<string, 'post' | 'comment'>
  >({})
  const [dataType, setDataType] = useState<'profile' | 'post' | 'comment'>(
    'profile'
  )
  const [fileType, setFileType] = useState<'json' | 'csv' | 'xlsx'>('xlsx')

  // 🔹 Ambil data dari chrome.storage.local
  useEffect(() => {
    async function loadData() {
      const { scrapedProfile = [] } = await chrome.storage.local.get([
        'scrapedProfile',
      ])
      setProfiles(scrapedProfile)
    }
    loadData()
  }, [])

  // 🔹 Checkbox handler
  const handleChecked = (id: string, checked: boolean | 'indeterminate') => {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((s) => s !== id)
    )
  }

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelected(
      checked ? profiles.map((d) => `${d.username}-${d.scrapedAt}`) : []
    )
  }

  const toggleExpand = (username: string) => {
    setExpanded((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    )
  }

  const togglePreviewMode = (username: string, mode: 'post' | 'comment') => {
    setPreviewModes((prev) => ({ ...prev, [username]: mode }))
  }

  const selectedItems = profiles.filter((d) =>
    selected.includes(`${d.username}-${d.scrapedAt}`)
  )

  // ==========================================================
  // 🔹 Helper: transform data
  // ==========================================================
  const extractProfiles = () =>
    selectedItems.map((p) => ({
      username: p.username,
      fullName: p.fullName,
      bio: p.biography || '',
      followers: p.followers || 0,
      following: p.following || 0,
      scrapedAt: p.scrapedAt,
    }))

  const extractPosts = () => {
    const rows: any[] = []
    for (const p of selectedItems) {
      if (p.posts?.length) {
        for (const post of p.posts.slice(0, 12)) {
          rows.push({
            username: p.username,
            fullName: p.fullName,
            post_id: post.id,
            caption: post.caption || '',
            likes: post.like_count || 0,
            comments_count: post.comment_count || 0,
            post_url: `https://instagram.com/p/${post.shortcode}`,
            scrapedAt: p.scrapedAt,
          })
        }
      }
    }
    return rows
  }

  const extractComments = () => {
    const rows: any[] = []
    for (const p of selectedItems) {
      if (p.posts?.length) {
        for (const post of p.posts.slice(0, 12)) {
          if (post.comments?.length) {
            for (const comment of post.comments) {
              rows.push({
                username: p.username,
                fullName: p.fullName,
                post_id: post.id,
                post_url: `https://instagram.com/p/${post.shortcode}`,
                commenter: comment.user || '',
                comment_text: comment.text || '',
                comment_like: comment.like_count || 0,
                scrapedAt: p.scrapedAt,
              })
            }
          }
        }
      }
    }
    return rows
  }

  // ==========================================================
  // 🔹 Generic download helpers
  // ==========================================================
  const downloadData = (
    data: any[],
    filename: string,
    format: 'json' | 'csv' | 'xlsx'
  ) => {
    if (!data.length) return alert('Tidak ada data untuk diunduh!')

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${filename}.json`
      link.click()
    }

    if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(data)
      const csv = XLSX.utils.sheet_to_csv(ws)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${filename}.csv`
      link.click()
    }

    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Data')
      XLSX.writeFile(wb, `${filename}.xlsx`)
    }
  }

  const handleDownload = () => {
    if (selectedItems.length === 0)
      return alert('Pilih minimal satu data terlebih dahulu!')

    let data: any[] = []
    let filename = dataType

    if (dataType === 'profile') data = extractProfiles()
    if (dataType === 'post') data = extractPosts()
    if (dataType === 'comment') data = extractComments()

    downloadData(data, filename, fileType)
  }

  const deleteSelected = async () => {
    const remaining = profiles.filter((p) => !selected.includes(p.username))
    await chrome.storage.local.set({ scrapedProfile: remaining })
    setProfiles(remaining)
    setSelected([])
  }

  // ==========================================================
  // 🔹 UI Rendering
  // ==========================================================
  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-lg font-semibold">📦 Scraped Instagram Data</h1>
      <p className="text-sm text-gray-500 mb-3">
        Total data tersimpan: {profiles.length}
      </p>

      {profiles.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <Checkbox
            checked={selected.length === profiles.length}
            onCheckedChange={handleSelectAll}
          />
          <label className="text-sm">Pilih Semua</label>
        </div>
      )}

      {/* Daftar Profil */}
      <div className="space-y-2">
        {profiles.map((p) => {
          const isExpanded = expanded.includes(p.username)
          const mode = previewModes[p.username] || 'post'

          return (
            <Card key={`${p.username}-${p.scrapedAt}`} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selected.includes(`${p.username}-${p.scrapedAt}`)}
                    onCheckedChange={(checked) =>
                      handleChecked(`${p.username}-${p.scrapedAt}`, checked)
                    }
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">@{p.username}</h2>
                      {p.posts?.length > 0 && (
                        <Badge variant="secondary">{p.posts.length} Post</Badge>
                      )}
                      {p.posts?.some(
                        (post: any) => post.comments?.length > 0
                      ) && <Badge variant="outline">Ada Komentar</Badge>}
                    </div>
                    <p className="text-sm text-gray-500">{p.fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-400">
                    {p.scrapedAt
                      ? new Date(p.scrapedAt).toLocaleString()
                      : 'Tidak diketahui'}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleExpand(p.username)}
                  >
                    {isExpanded ? (
                      <IconChevronUp className="h-4 w-4" />
                    ) : (
                      <IconChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <CardContent className="mt-3 bg-gray-50 rounded-md p-3 text-sm">
                  {/* 🔹 Toggle Preview Mode untuk masing-masing profil */}
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">
                      Preview Data ({mode === 'post' ? 'Post' : 'Comment'})
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant={mode === 'post' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => togglePreviewMode(p.username, 'post')}
                      >
                        <IconListDetails className="h-4 w-4 mr-1" /> Post
                      </Button>
                      <Button
                        variant={mode === 'comment' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => togglePreviewMode(p.username, 'comment')}
                      >
                        <IconMessageCircle className="h-4 w-4 mr-1" /> Comment
                      </Button>
                    </div>
                  </div>

                  <Separator className="mb-2" />

                  {/* Preview konten */}
                  {mode === 'post' ? (
                    p.posts?.length ? (
                      <div className="overflow-x-auto">
                        <table className="text-xs w-full border border-gray-300">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border p-1">Post ID</th>
                              <th className="border p-1">Caption</th>
                              <th className="border p-1">Likes</th>
                              <th className="border p-1">Comments</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.posts.map((post: any) => (
                              <tr key={post.id}>
                                <td className="border p-1">{post.id}</td>
                                <td className="border p-1 max-w-md truncate">
                                  {post.caption || '-'}
                                </td>
                                <td className="border p-1 text-center">
                                  {post.like_count || 0}
                                </td>
                                <td className="border p-1 text-center">
                                  {post.comment_count || 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs">
                        Tidak ada postingan.
                      </p>
                    )
                  ) : (
                    <div>
                      {p.posts?.some(
                        (post: any) => post.comments?.length > 0
                      ) ? (
                        <div className="overflow-x-auto">
                          <table className="text-xs w-full border border-gray-300">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border p-1">Post ID</th>
                                <th className="border p-1">User</th>
                                <th className="border p-1">Comment</th>
                                <th className="border p-1">Likes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {p.posts.map((post: any) =>
                                post.comments?.map((c: any, i: number) => (
                                  <tr key={`${post.id}-${i}`}>
                                    <td className="border p-1">{post.id}</td>
                                    <td className="border p-1">{c.username}</td>
                                    <td className="border p-1 truncate">
                                      {c.text || '-'}
                                    </td>
                                    <td className="border p-1 text-center">
                                      {c.like_count || 0}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-xs">
                          Tidak ada komentar.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Tombol Aksi */}
      {profiles.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Select value={dataType} onValueChange={(v: any) => setDataType(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Pilih Data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profile">Profile</SelectItem>
              <SelectItem value="post">Post</SelectItem>
              <SelectItem value="comment">Comment</SelectItem>
            </SelectContent>
          </Select>

          <Select value={fileType} onValueChange={(v: any) => setFileType(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Pilih Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleDownload}>
            <IconDownload className="mr-2 h-4 w-4" /> Download
          </Button>

          <Button variant="destructive" onClick={deleteSelected}>
            Hapus
          </Button>
        </div>
      )}
    </div>
  )
}
