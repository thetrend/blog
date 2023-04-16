## Repro Steps
1. `npm init vite@latest blog -- --template react-ts`
2. `cd blog`
3. `npm install`
4. `git init`
5. `git add .`
6. `git commit -m "Initial commit"`
7. (Create your own remote repository via github/gitlab/bitbucket or) `gh repo create`
8. (Optional if you used the above) `git push -u origin main`
9. `netlify init`
10. `netlify addons:create fauna`
11. `netlify addons:auth fauna`
12. (Git add/commit/push)
13. `npm i @netlify/functions`
14. `mkdir netlify/functions`
15. `touch netlify/functions/hello-world.ts`
16. ./netlify/functions/hello-world.ts:
```
import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  console.log('event', event);
  console.log('context', context);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello world' })
  }
};

export { handler };
```
17. `netlify dev`
18. (In Browser:) http://localhost:8888/.netlify/functions/hello-world
19. Add the following to netlify.toml above the code from Step 20:
```
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```
20. Uncomment the following from netlify.toml:
```
  [[redirects]]
   from = "/*"
   to = "/index.html"
   status = 200
```
21. (In Browser:) http://localhost:8888/api/hello-world
22. `mkdir db`
23. `touch db/bootstrap.ts`
24. `npm i faunadb`
25. `npm i -D @types/node`
26. db/bootstrap.ts:
```
import faunadb from 'faunadb';

console.log('Creating FaunaDB database...');

const createCollections = (key: string) => {
  const q = faunadb.query;
  const client = new faunadb.Client({
    secret: key
  });

  client.query(
    q.CreateCollection({ name: 'users' })
  )
    .then(response => console.log('Success: %s', response))
    .catch(error => console.error('Error: %s', error));

  client.query(
    q.CreateCollection({ name: 'posts' })
  )
    .then(response => console.log('Success: %s', response))
    .catch(error => console.error('Error: %s', error));
};

const createIndexes = (key: string) => {
  const q = faunadb.query;
  const client = new faunadb.Client({
    secret: key
  });

  client.query(
    q.CreateIndex({
      name: 'users_by_email',
      permissions: {
        read: 'public',
      },
      source: q.Collection('users'),
      terms: [
        {
          field: ['data', 'email']
        }
      ],
      unique: true,
    })
  )
    .then(response => console.log('Success: %s', response))
    .catch(error => console.error('Error: %s', error));

  client.query(
    q.CreateIndex({
      name: 'posts_by_users',
      source: [q.Collection('posts')],
      terms: [
        {
          field: ['data', 'userRef']
        }
      ]
    })
  )
    .then(response => console.log('Success: %s', response))
    .catch(error => console.error('Error: %s', error));
};

const createRoles = (key: string) => {
  const q = faunadb.query;
  const client = new faunadb.Client({
    secret: key
  });

  client.query(
    q.CreateRole({
      name: 'authors',
      membership: [
        {
          resource: q.Collection('users'),
        }
      ],
      privileges: [
        {
          resource: q.Collection('posts'),
          actions: {
            read: true,
            write: true,
            create: true,
            delete: true,
            history_read: false,
            history_write: false,
            unrestricted_read: false,
          }
        },
        {
          resource: q.Index('posts_by_users'),
          actions: {
            unrestricted_read: false,
            read: true,
          }
        }
      ]
    })
  )
    .then(response => console.log('Success: %s', response))
    .catch(error => console.error('Error: %s', error));
};

export {
  createCollections,
  createIndexes,
  createRoles
};
```
27.  `touch netlify/functions/fauna.ts`
28.  netlify/functions/fauna.ts:
```
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
```
29.  `touch netlify/functions/signup.ts`
30.  netlify/functions/signup.ts:
```
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
```
31.  Test http://localhost:8888/api/signup via Postman or Insomnia using the following JSON data in POST mode:
```
{
	"password": "abc123",
	"userData": {
		"name": "User Test",
		"email": "some@email.com"
	}
}
```
32.  Check that the Fauna users collection has a new row
33.  `touch netlify/functions/login.ts`
34.  netlify/functions/login.ts:
```
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
```
35.  Test http://localhost:8888/api/login via Postman or Insomnia using the following JSON data in POST mode:
```
{
	"password": "abc123",
  "email": "some@email.com"
}
```
36.  