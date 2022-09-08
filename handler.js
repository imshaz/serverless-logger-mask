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
    console.log(temp);

    temp = mask(temp);

    console.log(JSON.parse({ temp }));

    for (var items in temp) {
      console.log({ items });
    }

    // console.log({ temp });
    message = message + "APENEDED LOG " + temp;
    temp = JSON.stringify(temp);
    console.log(message);
  }

  debug(message) {
    const temp = JSON.parse(message);

    message = message + "APENEDED DEBUG " + temp;
    console.log(message);
  }

  info(message) {
    try {
      let temp = JSON.parse(message);
      console.log(temp);
      console.log(typeof message);
      console.log(typeof temp);

      temp = mask(temp);

      console.log({ temp });
      console.log(typeof temp);

      // console.log(JSON.parse({ temp }));

      // for (var items in temp) {
      //   console.log({ items });
      // }

      // console.log({ temp });
      message = message + "APENEDED LOG " + temp;
      temp = JSON.stringify(temp);
      console.log(message);

      message = message + "APENEDED INFO ";
      console.log(message);
      console.log(temp);
    } catch (error) {
      console.log({ error });
    }
  }

  warn(message) {
    const temp = JSON.parse(message);

    message = message + "APENEDED WARN " + temp;
    console.log(message);
  }

  error(message) {
    const temp = JSON.parse(message);

    message = message + "APENEDED ERROR " + temp;
    console.log(message);
  }
}

const log = new LambdaLog({
  logHandler: new CustomConsole(),
});

// Set logHandler to custom console
// log.options.logHandler = new CustomConsole();

app.get("/users", async function (req, res) {
  const params = {
    TableName: USERS_TABLE,
  };

  // log.info("Hello from LambdaLog!");
  // log.warn("something is missing, but it is OK");
  // log.debug("some debug message");
  // // Enable debug messages
  // log.options.debug = true;
  // log.debug("some debug message again");

  try {
    const { Items } = await dynamoDbClient.scan(params).promise();

    // const { userId, name } = Item;
    log.info("Hello from LambdaLog!", { Items });
    // log.warn("something is missing, but it is OK", { Items });
    // log.debug("some debug message", { Items });
    // Enable debug messages
    // log.options.debug = true;
    // log.debug("some debug message again", { Items });
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
