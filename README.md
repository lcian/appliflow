# appliflow

[appliflow](https://appliflow.vercel.app) is a web app that allows users to track and visualize the progress of their job applications.

https://github.com/user-attachments/assets/f4a7aa90-2b0a-41e3-a884-297149b2c258

Stack: Node.js, TypeScript, React, Next.js, NextAuth.js, Tailwind CSS, Prisma, Postgres, Vercel.

# Development

The easiest way to get started is to fork this repository and link your fork to a new Vercel project.

The first deployment will fail because the database is not set up. To fix this, create a Postgres database and link it to your project in Vercel.

You can pull the `.env` file from Vercel by using the Vercel CLI with the `vercel env pull` command.

You also need to set up the environment variables `NEXTAUTH_URL`,
`NEXTAUTH_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` for authentication to work.
