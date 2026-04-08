import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserPayload } from '../../users/user.model';

export const CurrentUser = createParamDecorator(
  (field: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user: UserPayload }>();
    const user = request.user;

    return field ? user?.[field] : user;
  },
);
