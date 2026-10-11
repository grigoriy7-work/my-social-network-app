export type CreateUserDTO = {
  first_name: string;
  second_name: string;
  birthdate: string;
  biography: string;
  city: string;
  password: string;
};

export type User = CreateUserDTO & {
  id: string;
};
