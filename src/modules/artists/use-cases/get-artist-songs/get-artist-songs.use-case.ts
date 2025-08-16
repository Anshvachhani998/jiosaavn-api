import { Endpoints } from '#common/constants'
import { useFetch } from '#common/helpers'
import { HTTPException } from 'hono/http-exception'
import type { IUseCase } from '#common/types'
import type { ArtistSongAPIResponseModel, ArtistSongModel } from '#modules/artists/models'
import type { z } from 'zod'

export interface GetArtistSongsArgs {
  artistId: string
  sortBy: 'popularity' | 'latest' | 'alphabetical'
  sortOrder: 'asc' | 'desc'
}

export class GetArtistSongsUseCase implements IUseCase<GetArtistSongsArgs, z.infer<typeof ArtistSongModel>> {
  constructor() {}

  async execute({ artistId, sortOrder, sortBy }: GetArtistSongsArgs) {
    const allSongs: { id: string, name: string }[] = []
    let currentPage = 1
    let totalPages = 1

    do {
      const { data } = await useFetch<z.infer<typeof ArtistSongAPIResponseModel>>({
        endpoint: Endpoints.artists.songs,
        params: {
          artistId,
          page: currentPage,
          sort_order: sortOrder,
          category: sortBy
        }
      })

      if (!data) throw new HTTPException(404, { message: 'artist songs not found' })

      // Sirf id + name extract karo
      allSongs.push(...data.topSongs.songs.map(song => ({
        id: song.id,
        name: song.name
      })))

      // Total pages calculate karo
      totalPages = Math.ceil(data.topSongs.total / data.topSongs.songs.length)
      currentPage++
    } while (currentPage <= totalPages)

    return {
      total: allSongs.length,
      songs: allSongs
    }
  }
}
