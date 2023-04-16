import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import faunadb from 'faunadb';

const q = faunadb.query;
const client = new faunadb.Client({
  secret: process.env.FAUNADB_ADMIN_SECRET!
});

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
/*
TODO: error states if the event body is empty
 */
  let payload = JSON.parse(event.body!);
  let userData = payload.userData;
  let password = payload.password;

  try {
    const user: any = await client.query(
      q.Create(
        q.Collection('users'), {
        credentials: {
          password,
        },
        data: userData
      }
      )
    );

    const response = user.data;
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error })
    }
  }
};

export { handler };