import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { ArtistAlbumModel, ArtistModel, ArtistSongModel } from '#modules/artists/models'
import { ArtistService } from '#modules/artists/services'
import { z } from 'zod'
import type { Routes } from '#common/types'

export class ArtistController implements Routes {
  public controller: OpenAPIHono
  private artistService: ArtistService

  constructor() {
    this.controller = new OpenAPIHono()
    this.artistService = new ArtistService()
  }

  public initRoutes() {
    this.controller.openapi(
        createRoute({
            method: 'get',
            path: '/artists/{id}/songs',
            tags: ['Artists'],
            summary: `Retrieve artist's songs (music IDs + total count)`,
            description: 'Retrieve a list of songs for a given artist by their ID, returning only music IDs and total count.',
            operationId: 'getArtistSongs',
            request: {
                params: z.object({
                    id: z.string().openapi({
                        description: 'ID of the artist to retrieve the songs for',
                        type: 'string',
                        example: '1274170'
                    })
                }),
                query: z.object({
                    page: z.string()
                        .pipe(z.coerce.number())
                        .optional()
                        .openapi({
                            description: 'The page number of the results to retrieve',
                            type: 'number',
                            example: '0',
                            default: '0'
                        }),
                    sortBy: z.enum(['popularity', 'latest', 'alphabetical'])
                        .optional()
                        .openapi({
                            description: 'The criterion to sort the songs by',
                            type: 'string',
                            example: 'popularity',
                            default: 'popularity'
                        }),
                    sortOrder: z.enum(['asc', 'desc'])
                        .optional()
                        .openapi({
                            description: 'The order to sort the songs',
                            type: 'string',
                            example: 'desc',
                            default: 'desc'
                        })
                })
            },
            responses: {
                200: {
                    description: 'Successful response with a list of songs for the artist (music IDs + total count)',
                    content: {
                        'application/json': {
                            schema: z.object({
                                success: z.boolean().openapi({
                                    description: 'Indicates whether the request was successful',
                                    type: 'boolean',
                                    example: true
                                }),
                                data: z.object({
                                    total: z.number(),
                                    songs: z.array(
                                        z.object({
                                            musicId: z.string()
                                        })
                                    )
                                })
                            })
                        }
                    }
                },
                404: {
                    description: 'Artist not found for the given ID'
                }
            }
        }),
        async (ctx) => {
            const artistId = ctx.req.param('id')
            const { page, sortBy, sortOrder } = ctx.req.valid('query')

            const response = await this.artistService.getArtistSongs({
                artistId,
                page: page || 0,
                sortBy: sortBy || 'popularity',
                sortOrder: sortOrder || 'desc'
            })

            // Map response to only music IDs
            const songsOnly = response.songs.map((s: any) => ({
                musicId: s.id
            }))

            return ctx.json({ success: true, data: { total: response.total, songs: songsOnly } })
        }
    )


    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/artists/{id}/albums',
        tags: ['Artists'],
        summary: `Retrieve artist's albums`,
        description: 'Retrieve a list of albums for a given artist by their ID, with optional sorting and pagination.',
        operationId: 'getArtistAlbums',
        request: {
          params: z.object({
            id: z.string().openapi({
              description: 'ID of the artist to retrieve the albums for',
              type: 'string',
              example: '1274170',
              default: '1274170'
            })
          }),
          query: z.object({
            page: z.string().pipe(z.coerce.number()).optional().openapi({
              description: 'The page number of the results to retrieve',
              type: 'number',
              example: '0',
              default: '0'
            }),
            sortBy: z
              .enum(['popularity', 'latest', 'alphabetical'])
              .optional()
              .openapi({
                description: 'The criterion to sort the albums by',
                type: 'string',
                example: 'popularity',
                enum: ['popularity', 'latest', 'alphabetical'],
                default: 'popularity'
              }),
            sortOrder: z
              .enum(['asc', 'desc'])
              .optional()
              .openapi({
                description: 'The order to sort the albums',
                type: 'string',
                example: 'desc',
                enum: ['asc', 'desc'],
                default: 'desc'
              })
          })
        },
        responses: {
          200: {
            description: 'Successful response with a list of albums for the artist',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean().openapi({
                    description: 'Indicates whether the request was successful',
                    type: 'boolean',
                    example: true
                  }),
                  data: ArtistAlbumModel.openapi({
                    description: 'An array of albums associated with the artist'
                  })
                })
              }
            }
          },
          404: {
            description: 'Artist not found for the given ID'
          }
        }
      }),
      async (ctx) => {
        const artistId = ctx.req.param('id')
        const { page, sortBy, sortOrder } = ctx.req.valid('query')

        const response = await this.artistService.getArtistAlbums({
          artistId,
          page: page || 0,
          sortBy: sortBy || 'popularity',
          sortOrder: sortOrder || 'desc'
        })

        return ctx.json({ success: true, data: response })
      }
    )
  }
}
