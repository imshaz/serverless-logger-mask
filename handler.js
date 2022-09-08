const AWS = require("aws-sdk");
const express = require("express");
const serverless = require("serverless-http");
const { LambdaLog } = require("lambda-log");

const app = express();

const USERS_TABLE = process.env.USERS_TABLE;
const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

app.use(express.json());
// Set logHandler to a new instance of the Console class.

function isArray(data) {
  return Array.isArray(data);
}

function isPlainObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}

// const maskedFieldsKeys = ["propA", "propDBA", "propE1B", "propD", "propC", "0"];
maskedFieldsKeys = ["name"];

function mask(objOrArr) {
  const masked = {};
  for (let key in objOrArr) {
    const val = objOrArr[key];
    if (isPlainObject(val) || isArray(val)) {
      masked[key] = mask(val);
    } else {
      let maskedValue = "";

      masked[key] = objOrArr[key];
      if (maskedFieldsKeys.includes(key)) {
        [...objOrArr[key]].forEach((item) => {
          maskedValue = maskedValue + "*";
        });
        masked[key] = maskedValue;
      }
    }
  }
  return masked;
}
class CustomConsole {
  log(message) {
    let temp = JSON.parse(message);
    temp = mask(temp);
    temp = JSON.stringify(temp);

    console.log(temp);
  }

  debug(message) {
    let temp = JSON.parse(message);
    temp = mask(temp);
    temp = JSON.stringify(temp);
    console.debug(tmep);
  }

  info(message) {
    try {
      let temp = JSON.parse(message);
      temp = mask(temp);
      temp = JSON.stringify(temp);
      console.log(temp);
    } catch (error) {
      console.log({ error });
    }
  }

  warn(message) {
    let temp = JSON.parse(message);
    temp = mask(temp);
    temp = JSON.stringify(temp);
    console.warn(temp);
  }

  error(message) {
    let temp = JSON.parse(message);
    temp = mask(temp);
    temp = JSON.stringify(temp);
    console.error(temp);
  }
}

const log = new LambdaLog({
  logHandler: new CustomConsole(),
});

app.get("/users", async function (req, res) {
  const params = {
    TableName: USERS_TABLE,
  };

  try {
    const { Items } = await dynamoDbClient.scan(params).promise();

    log.log("Hello from LambdaLog!", { Items });
    log.info("Hello from LambdaLog!", { Items });
    log.warn("Hello from LambdaLog!", { Items });
    log.debug("Hello from LambdaLog!", { Items });
    log.error("Hello from LambdaLog!", { Items });

    if (Items) {
      res.json(Items);
    } else {
      res.status(404).json({ error: "Could not find usera" });
    }
  } catch (error) {
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
