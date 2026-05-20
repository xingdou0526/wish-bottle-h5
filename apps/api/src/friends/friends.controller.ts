import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { CreateInviteSchema, type CreateInviteDto } from '@wishbottle/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser, JwtUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FriendsService } from './friends.service';

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  @Get()
  list(@CurrentUser() me: JwtUser) {
    return this.friends.list(me.id);
  }

  @Delete(':id')
  remove(@CurrentUser() me: JwtUser, @Param('id') id: string) {
    return this.friends.remove(me.id, id);
  }

  @Post('invites')
  invite(
    @CurrentUser() me: JwtUser,
    @Body(new ZodValidationPipe(CreateInviteSchema)) dto: CreateInviteDto,
  ) {
    return this.friends.createInvite(me.id, dto.toEmail);
  }

  @Get('invites')
  listInvites(
    @CurrentUser() me: JwtUser,
    @Query('direction') direction: 'incoming' | 'outgoing' = 'incoming',
  ) {
    return this.friends.listInvites(me.id, direction);
  }

  @Post('invites/:id/accept')
  accept(@CurrentUser() me: JwtUser, @Param('id') id: string) {
    return this.friends.accept(me.id, id);
  }

  @Post('invites/:id/decline')
  decline(@CurrentUser() me: JwtUser, @Param('id') id: string) {
    return this.friends.decline(me.id, id);
  }
}
