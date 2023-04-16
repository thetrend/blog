import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import faunadb from 'faunadb';

const q = faunadb.query;
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET!
});

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {

  try {
    const response = await client.query(
        q.Map(
          q.Paginate(
            q.Documents(
              q.Collection('posts')
            ),
            { size: 100 }
          ),
          q.Lambda('ref', q.Get(q.Var('ref')))
        )
    );
    return {
      statusCode: 200,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error })
    };
  }
};

export { handler };