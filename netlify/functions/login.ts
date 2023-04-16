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
  const email = payload.email;
  const password = payload.password;

  try {
    const response = await client.query(
      q.Login(
        q.Match(
          q.Index('users_by_email'),
          email
        ),
        {
          password
        }
      )
    );
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
    };
  }
};

export { handler };