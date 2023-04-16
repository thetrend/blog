import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import faunadb from 'faunadb';

const q = faunadb.query;

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  let payload = JSON.parse(event.body!);
  let authorization: any = event.headers.authorization?.split(' ');
  const token = authorization[1];

  const client = new faunadb.Client({
    secret: token
  });

  try {
    const response = await client.query(
      q.Create(
        q.Collection('posts'), {
          data: {
            title: payload.title,
            content: payload.content,
            userRef: q.Ref(
              q.Collection('users'),
              payload.user_id
            )
          }
        }
      )
    )
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error })
    };
  }
};

export { handler };