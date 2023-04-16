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