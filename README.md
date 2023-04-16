## Repro Steps
1. npm init vite@latest blog -- --template react-ts
2. cd blog
3. npm install
4. git init
5. git add .
6. git commit -m "Initial commit"
7. (Create your own remote repository via github/gitlab/bitbucket or) gh repo create
8. (Optional if you used the above) git push -u origin main
9. netlify init
10. netlify addons:create fauna
11. netlify addons:auth fauna
12. (Git add/commit/push)
13. mkdir netlify/functions
14. touch netlify/functions/hello-world.ts
15. npm i @netlify/functions
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
17. netlify dev
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