import { pool, initDb } from "./db.js";
import type { CreateUserDTO, User } from "./types.js";
import express, { type Request, type Response } from "express";

const app = express();
const PORT = process.env.APP_PORT || 3000;

app.use(express.json());

app.get("/user/get/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const result = await pool.query<User>(
      "SELECT * FROM users ORDER BY id ASC",
    );

    try {
      const query = `
      SELECT * FROM users 
      WHERE id = $1;
    `;
      const values = [id];
      const result = await pool.query<User>(query, values);

      console.info("result: ", result);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      res.status(200).json(result.rows[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.get("/users", async (req: Request, res: Response) => {
  try {
    const result = await pool.query<User>(
      "SELECT * FROM users ORDER BY id ASC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Ошибка сервера при получении пользователей" });
  }
});

app.post(
  "/user/register",
  async (req: Request<{}, {}, CreateUserDTO>, res: Response) => {
    const { first_name, second_name, birthdate, password } = req.body;

    if (!first_name || !second_name || !birthdate || !password) {
      return res.status(400).json({
        error: "Поля first_name, second_name, birthdate, password обязательны",
      });
    }

    try {
      const query = `
      INSERT INTO users (first_name, second_name, birthdate, password) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *;
    `;
      const values = [first_name, second_name, birthdate, password];
      const result = await pool.query<User>(query, values);
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      console.error(err);
      res
        .status(500)
        .json({ error: "Ошибка сервера при создании пользователя" });
    }
  },
);

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
  });
});
