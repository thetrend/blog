import {
  createCollections,
  createIndexes,
  createRoles
} from '../../db/bootstrap';

import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

/*
TODO: return an error message if collections exist
 */

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (!process.env.FAUNADB_ADMIN_SECRET) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Fauna Secret Key missing.' })
    }
  } else {
    createCollections(process.env.FAUNADB_ADMIN_SECRET);
    createIndexes(process.env.FAUNADB_ADMIN_SECRET);
    createRoles(process.env.FAUNADB_ADMIN_SECRET);
  }
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Fauna items generated.' })
  }
};

export { handler };