import { IsString, Length } from "class-validator";

export class LoginDto {
  @IsString()
  @Length(1, 60)
  usuario!: string;

  @IsString()
  @Length(1, 200)
  password!: string;
}
