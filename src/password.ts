import argon2 from "argon2";

export async function hashPassword(plainPassword: string) {
  try {
    const hash = await argon2.hash(plainPassword, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 МБ памяти (рекомендация OWASP)
      timeCost: 3, // количество итераций
      parallelism: 1, // степень параллелизма
    });
    return hash;
  } catch (err) {
    console.error("Ошибка при хэшировании пароля:", err);
    throw new Error("Internal server error");
  }
}

export async function verifyPassword(
  storedHash: string,
  plainPassword: string,
) {
  try {
    const match = await argon2.verify(storedHash, plainPassword);
    return match;
  } catch (err) {
    console.error("Ошибка при проверке пароля:", err);
    return false;
  }
}
