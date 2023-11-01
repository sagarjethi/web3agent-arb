import { kv } from '@vercel/kv'
import { Configuration, OpenAIApi } from 'openai-edge'
import { Message, OpenAIStream, StreamingTextResponse } from "ai";
import { configs } from '@/configs'
// import { auth } from '@/auth'
// import { options } from "@/app/api/auth/[...nextauth]/options"
// import { getServerSession } from "next-auth/next"
import { nanoid } from '@/app/lib/utils'

export async function POST(req: Request) {
  try {


    const json = await req.json()
    const { messages, functions, function_call } = json
    const { user }: any = { user: {} }//await getServerSession(options) as any

    // if (!user || !user?.email) {
    //   return new Response('Unauthorized', { status: 401 })
    // }
    const userId = 'DEV_TEST'//user?.email;

    const configuration = new Configuration({
      apiKey: configs.OPENAI_API_KEY
    })

    const openai = new OpenAIApi(configuration)

    // Ask OpenAI for a streaming chat completion given the prompt
    const res = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      // model: 'gpt-4',
      stream: true,
      messages,
      functions,
      function_call
    });

    const stream = OpenAIStream(res, {
      async onCompletion(completion) {
        const title = messages.find((m: Message) => m.role !== 'system')?.content.substring(0, 100)
        const id = json.id ?? nanoid()
        const createdAt = Date.now()
        const path = `/chat/${id}`
        const payload = {
          id,
          title,
          userId,
          createdAt,
          path,
          messages: [
            ...messages,
            {
              content: completion,
              role: 'assistant'
            }
          ]
        }
        await kv.hmset(`chat:${id}`, payload)
        await kv.zadd(`user:chat:${userId}`, {
          score: createdAt,
          member: `chat:${id}`
        })
      }
    })

    return new StreamingTextResponse(stream)
  } catch (error) {
    return new Response('Unauthorized', { status: 401 })
  }
}