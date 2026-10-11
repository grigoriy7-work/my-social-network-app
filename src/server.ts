import { pool, initDb } from "./db.js";
import type { CreateUserDTO, User, LoginDTO } from "./types.js";
import express, { type Request, type Response } from "express";
import { hashPassword, verifyPassword } from "./password.js";
import crypto from "crypto";

const app = express();
const PORT = process.env.APP_PORT || 3000;

app.use(express.json());

app.get("/user/get/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    try {
      const query = `
      SELECT * FROM users 
      WHERE id = $1;
    `;
      const values = [id];
      const result = await pool.query<User>(query, values);

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
    const { first_name, second_name, birthdate, biography, city, password } =
      req.body;

    if (
      !first_name ||
      !second_name ||
      !birthdate ||
      !biography ||
      !city ||
      !password
    ) {
      return res.status(400).json({
        error: "Не все поля заполнены",
      });
    }

    try {
      const query = `
      INSERT INTO users (first_name, second_name, birthdate, biography, city, password) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *;
    `;
      const passwordHash = await hashPassword(password);
      const values = [
        first_name,
        second_name,
        birthdate,
        biography,
        city,
        passwordHash,
      ];
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

app.post("/login", async (req: Request<{}, {}, LoginDTO>, res: Response) => {
  const { id, password } = req.body;

  if (!id || !password) {
    return res.status(400).json({
      error: "Не заполнены обязательные поля!",
    });
  }

  try {
    const query = `
      SELECT * FROM users 
      WHERE id = $1;
    `;
    const values = [id];
    const userResult = await pool.query<User>(query, values);

    if (userResult.rows[0] === undefined) {
      return res.status(401).json({ error: "Неверный id или пароль" });
    }
    const user = userResult.rows[0];
    const isValidPassword = await verifyPassword(user.password, password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Неверный id или пароль" });
    }

    const sessionId = crypto.randomUUID();

    await pool.query(`INSERT INTO sessions (id, user_id) VALUES ($1, $2)`, [
      sessionId,
      user.id,
    ]);

    res.status(200).json({ token: sessionId });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
  });
});
