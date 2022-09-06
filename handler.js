const AWS = require("aws-sdk");
const express = require("express");
const serverless = require("serverless-http");

const { Logger } = require("lambda-logger-node");
const logger = Logger();
const log = require("lambda-log");
const app = express();

const USERS_TABLE = process.env.USERS_TABLE;
const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

app.use(express.json());

app.get("/users", async function (req, res) {
  const params = {
    TableName: USERS_TABLE,
  };

  logger.info("getting users");

  log.info("Hello from LambdaLog!");
  log.warn("something is missing, but it is OK");
  log.debug("some debug message");
  // Enable debug messages
  log.options.debug = true;
  log.debug("some debug message again");

  try {
    const { Items } = await dynamoDbClient.scan(params).promise();
    console.log({ Items });
    if (Items) {
      // const { userId, name } = Item;
      logger.error(
        "somethign went wrong, unable to retrive users, error",
        Items
      );
      logger.warn("somethign went wrong, unable to retrive users, warn", Items);
      res.json(Items);
    } else {
      logger.error("somethign went wrong, unable to retrive users, error");
      logger.warn("somethign went wrong, unable to retrive users, warn");

      res.status(404).json({ error: "Could not find usera" });
    }
  } catch (error) {
    logger.error("somethign went wrong, unable to retrive users", error);

    console.log(error);
    res.status(500).json({ error: "Could not retreive user" });
  }
});

app.get("/users/:userId", async function (req, res) {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.get(params).promise();
    if (Item) {
      const { userId, name } = Item;
      res.json({ userId, name });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find user with provided "userId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive user" });
  }
});

app.post("/users", async function (req, res) {
  const { userId, name } = req.body;
  if (typeof userId !== "string") {
    res.status(400).json({ error: '"userId" must be a string' });
  } else if (typeof name !== "string") {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId: userId,
      name: name,
    },
  };

  try {
    await dynamoDbClient.put(params).promise();
    res.json({ userId, name });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create user" });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
