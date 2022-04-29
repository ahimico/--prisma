import { makeExecutableSchema } from "@graphql-tools/schema";
import { PrismaClient } from "@prisma/client";
import * as bodyParser from "body-parser-graphql";
import cors from "cors";
import express from "express";
import { graphqlHTTP } from "express-graphql";

const prisma = new PrismaClient();

const typeDefs = `
  type User {
    email: String!
    name: String
    id: ID!
    posts: [Post]
  }
  type Post {
    id: ID
    title: String!
    content: String
    published: Boolean
    author: User
    authorId: Int
  }

  type Query {
    users: [User!]!
    feed: [Post]
  }
`;

const resolvers = {
  Query: {
    users: () => prisma.user.findMany({ include: { posts: true } }),
    // FIXME: is not exist on type UserInput
    // TODO: Make it clear graphql endpoint
    // TODO: "Cannot return null for non-nullable field Post.title.
    feed: () =>
      prisma.user.findMany({
        // where: { published: true },
        // include: { author: true }
      }),
  },
};
export const schema = makeExecutableSchema({ resolvers, typeDefs });

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.graphql());
app.use("/graphql", graphqlHTTP({ schema }));

// TODO: how to to params via input field in graphql
app.get(`/post/:id`, async (req, res) => {
  const { id } = req.params;
  // const post = await prisma.post.findOne({ // ERROR
  const post = await prisma.post.findMany({ where: { id: Number(id) } });
  res.json(post);
});

app.post(`/user`, async (req, res) => {
  const result = await prisma.user.create({ data: { ...req.body } });
  res.json(result);
});

app.post(`/post`, async (req, res) => {
  const { title, content, authorEmail } = req.body;
  const result = await prisma.post.create({
    data: {
      title,
      content,
      published: false,
      author: { connect: { email: authorEmail } },
    },
  });
  res.json(result);
});

app.put("/post/publish/:id", async (req, res) => {
  const { id } = req.params;
  const post = await prisma.post.update({
    where: { id: Number(id) },
    data: { published: true },
  });
  res.json(post);
});

app.delete(`/post/:id`, async (req, res) => {
  const { id } = req.params;
  const post = await prisma.post.delete({ where: { id: Number(id) } });
  res.json(post);
});
// TODO: add mutations via graphql

app.listen(4000, () => {
  console.log(`GraphQL server running on http://localhost:${4000}/graphql`);
});
