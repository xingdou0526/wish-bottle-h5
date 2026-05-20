import { Body, Controller, Patch, UseGuards, UsePipes } from '@nestjs/common';
import { UpdateProfileSchema, type UpdateProfileDto } from '@wishbottle/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser, JwtUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('me')
  updateMe(
    @CurrentUser() me: JwtUser,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) dto: UpdateProfileDto,
  ) {
    return this.users.updateMe(me.id, dto);
  }
}
