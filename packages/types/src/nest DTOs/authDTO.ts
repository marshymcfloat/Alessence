import { createZodDto } from "nestjs-zod";

import {
  authLoginSchema,
  authRegisterSchema,
} from "../next schemas/authSchemas";

export class AuthLoginDTO extends createZodDto(authLoginSchema) {}
export class AuthRegisterDTO extends createZodDto(authRegisterSchema) {}
