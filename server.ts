import 'dotenv/config'
import axios from 'axios'
import fastify, { FastifyRequest } from 'fastify'
import { createClient } from 'redis'

const server = fastify({ logger: true })

type Gist = {
  id: string
}

server.get('/user/:user', async (req: FastifyRequest<{
  Params: {
    user: string
  }
}>): Promise<Gist[]|string> => {
  try {
    const { data } = await axios.get<Gist[]>(`https://api.github.com/users/${req.params.user}/gists`, {
      headers: {
        Accept: 'application/json',
        OAUth: process.env.GITHUB_ACCESS_TOKEN || ''
      }
    })

    const client = createClient()
    client.on('error', (err) => console.error('Redis Client Error', err))
    await client.connect()
  
    const query = await client.get(req.params.user)

    let newData: Gist[] = data
    if (query) {
      const savedData: string[] = JSON.parse(query)

      newData = newData.filter(f => !savedData.find(s => s === f.id))
    }

    if (newData.length) {
      client.set(req.params.user, JSON.stringify(data.map(d => d.id)))
    }

    return newData
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log('error message: ', error.message)
      return error.message
    } else {
      console.log('unexpected error: ', error)
      return 'An unexpected error occurred'
    }
  }
})

const start = async () => {
  try {
    server.listen({ port: process.env.PORT ? parseInt(process.env.PORT) : 3000 })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}
start()